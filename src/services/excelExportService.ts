import ExcelJS from 'exceljs';
import { Room, Booking, HotelSettings } from '../types';

export interface ExportOptions {
  rooms: Room[];
  bookings: Booking[];
  settings: HotelSettings;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  includedSheets: {
    chessboard: boolean;
    bookingsRegistry: boolean;
    arrivalsDepartures: boolean;
    kpiSummary: boolean;
  };
}

/**
 * Converts 1-based column number to Excel column letters (1 -> A, 27 -> AA, etc.)
 */
export function getColumnLetter(colIndex: number): string {
  let temp: number;
  let letter = '';
  let col = colIndex;
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = Math.floor((col - temp - 1) / 26);
  }
  return letter;
}

// Brand Color Palette (Avenue TravelLine Aesthetic)
const PALETTE = {
  primary: 'FF4A6353',       // Deep cypress / sage
  primaryDark: 'FF374A3E',   // Dark cypress
  primaryLight: 'FF5F7A69',  // Medium sage
  primaryTint: 'FFEBF0EC',   // Soft sage tint
  primarySubtle: 'FFF4F7F5', // Ultra soft sage
  accentGold: 'FFC5A880',    // Warm brass / bronze
  textMain: 'FF1C1D1A',      // Dark charcoal
  textMuted: 'FF64748B',     // Slate muted
  textWhite: 'FFFFFFFF',     // Pure white
  border: 'FFD9D9D9',        // Light gray border
  borderSubtle: 'FFE8E5DD',  // Warm sand border
  bgCanvas: 'FFFAF8F5',      // Warm canvas
  bgWeekend: 'FFEFE8DF',     // Soft weekend header
  weekendCell: 'FFFAF6F0',   // Weekend body column tint
  statusConfirmedBg: 'FFDCFCE7', // Soft green
  statusConfirmedFg: 'FF166534', // Dark green
  statusCheckedInBg: 'FFDBEAFE', // Soft blue
  statusCheckedInFg: 'FF1E40AF', // Dark blue
  statusCheckedOutBg: 'FFE0E7FF',// Soft indigo
  statusCheckedOutFg: 'FF3730A3',// Dark indigo
  statusCancelledBg: 'FFFEE2E2', // Soft red
  statusCancelledFg: 'FF991B1B', // Dark red
  statusPendingBg: 'FFFEF3C7',   // Soft yellow/amber
  statusPendingFg: 'FF92400E',   // Dark amber
};

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: PALETTE.border } },
  left: { style: 'thin', color: { argb: PALETTE.border } },
  bottom: { style: 'thin', color: { argb: PALETTE.border } },
  right: { style: 'thin', color: { argb: PALETTE.border } },
};

const doubleBorderBottom: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: PALETTE.border } },
  left: { style: 'thin', color: { argb: PALETTE.border } },
  bottom: { style: 'double', color: { argb: PALETTE.textMain } },
  right: { style: 'thin', color: { argb: PALETTE.border } },
};

/**
 * Generate dates array [startDate, endDate] inclusive
 */
function getDatesInRange(startStr: string, endStr: string): { dateStr: string; day: number; month: number; weekdayRu: string; isWeekend: boolean }[] {
  const result: { dateStr: string; day: number; month: number; weekdayRu: string; isWeekend: boolean }[] = [];
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const current = new Date(sy, sm - 1, sd, 12, 0, 0);
  const end = new Date(ey, em - 1, ed, 12, 0, 0);

  const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const dayOfWeek = current.getDay();

    result.push({
      dateStr,
      day: current.getDate(),
      month: current.getMonth() + 1,
      weekdayRu: weekdays[dayOfWeek],
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

function formatDateRu(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split(' ')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

function formatDateTimeRu(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Auto-fit column widths with bounds, ignoring merged top headers
 */
function autoFitColumns(worksheet: ExcelJS.Worksheet, minWidth = 12, maxWidth = 48) {
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      // Ignore main banner title rows 1-3 to avoid artificial column stretching
      if (Number(cell.row) <= 3) return;
      const val = cell.value;
      let text = '';
      if (val !== null && val !== undefined) {
        if (typeof val === 'object' && 'result' in val) {
          text = String(val.result || '');
        } else if (typeof val === 'object' && 'text' in val) {
          text = String(val.text || '');
        } else {
          text = String(val);
        }
      }
      if (text.length > maxLength) {
        maxLength = text.length;
      }
    });
    column.width = Math.min(Math.max(maxLength + 3, minWidth), maxWidth);
  });
}

/**
 * Style standard branded sheet header (Rows 1-3)
 */
function applyBrandedHeader(
  ws: ExcelJS.Worksheet,
  title: string,
  settings: HotelSettings,
  startDate: string,
  endDate: string,
  maxCols = 6
) {
  // Row 1: Hotel Name & Report Title
  const titleRow = ws.getRow(1);
  titleRow.height = 32;
  const colLetter = getColumnLetter(maxCols);
  ws.mergeCells(`A1:${colLetter}1`);
  const titleCell = ws.getCell('A1');
  titleCell.value = `${settings.hotel_name || 'Гостиница «Победа» (г. Феодосия)'} — ${title}`;
  titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: PALETTE.primary } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 2: Hotel Contact Info
  const subRow = ws.getRow(2);
  subRow.height = 18;
  ws.mergeCells(`A2:${colLetter}2`);
  const subCell = ws.getCell('A2');
  subCell.value = `Адрес: ${settings.hotel_address || 'г. Феодосия, ул. Победы, д. 36/1'} | Тел: ${settings.hotel_phone || '+7 (995) 171-16-64'} | Email: ${settings.hotel_email || 'booking@serdtse-feodosia.ru'}`;
  subCell.font = { name: 'Calibri', size: 9.5, color: { argb: PALETTE.textMuted } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 3: Legal info & Period
  const metaRow = ws.getRow(3);
  metaRow.height = 18;
  ws.mergeCells(`A3:${colLetter}3`);
  const metaCell = ws.getCell('A3');
  metaCell.value = `Реквизиты: ${settings.legal_entity || 'ИП'} (ИНН ${settings.legal_inn || '—'}) | Период отчета: ${formatDateRu(startDate)} — ${formatDateRu(endDate)} | Сформировано: ${formatDateTimeRu(new Date())}`;
  metaCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: PALETTE.textMuted } };
  metaCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 4: Spacer
  ws.getRow(4).height = 10;
}

/**
 * SHEET 1: «Шахматка» (Room Rack / Chessboard)
 */
function buildChessboardSheet(
  workbook: ExcelJS.Workbook,
  rooms: Room[],
  bookings: Booking[],
  settings: HotelSettings,
  startDate: string,
  endDate: string
) {
  const ws = workbook.addWorksheet('Шахматка', {
    properties: { tabColor: { argb: PALETTE.primary } },
    views: [{ state: 'frozen', xSplit: 2, ySplit: 5 }],
  });

  const dates = getDatesInRange(startDate, endDate);
  const totalCols = 2 + dates.length;

  applyBrandedHeader(ws, 'Шахматка бронирований номерного фонда', settings, startDate, endDate, Math.max(totalCols, 8));

  // Row 5: Column Headers
  const headerRow = ws.getRow(5);
  headerRow.height = 32;

  // Col A: Room / Category
  const roomHeader = headerRow.getCell(1);
  roomHeader.value = 'Номер / Категория';
  roomHeader.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: PALETTE.textWhite } };
  roomHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primary } };
  roomHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  roomHeader.border = thinBorder;

  // Col B: Base Price
  const priceHeader = headerRow.getCell(2);
  priceHeader.value = 'Базовая цена';
  priceHeader.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: PALETTE.textWhite } };
  priceHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primary } };
  priceHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  priceHeader.border = thinBorder;

  // Date Columns: Col 3 .. 2 + dates.length
  dates.forEach((d, idx) => {
    const colIdx = 3 + idx;
    const cell = headerRow.getCell(colIdx);
    const dayStr = String(d.day).padStart(2, '0');
    const monthStr = String(d.month).padStart(2, '0');
    cell.value = `${dayStr}.${monthStr}\n${d.weekdayRu}`;
    cell.border = thinBorder;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    if (d.isWeekend) {
      // Soft warm weekend header
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.bgWeekend } };
      cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: PALETTE.primaryDark } };
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primary } };
      cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: PALETTE.textWhite } };
    }
  });

  // Room Rows: Row 6 .. (5 + rooms.length)
  const firstRoomRow = 6;
  const lastRoomRow = 5 + rooms.length;

  rooms.forEach((room, roomIdx) => {
    const rowIdx = firstRoomRow + roomIdx;
    const row = ws.getRow(rowIdx);
    row.height = 28;

    // Col A: Room Title
    const titleCell = row.getCell(1);
    titleCell.value = room.title;
    titleCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.textMain } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    titleCell.border = thinBorder;
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: roomIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAF9' } };

    // Col B: Base Price
    const priceCell = row.getCell(2);
    priceCell.value = room.price_base;
    priceCell.numFmt = '#,##0 "₽"';
    priceCell.font = { name: 'Calibri', size: 10, color: { argb: PALETTE.primaryDark } };
    priceCell.alignment = { vertical: 'middle', horizontal: 'right' };
    priceCell.border = thinBorder;
    priceCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: roomIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAF9' } };

    // Date Cells: Check occupancy
    dates.forEach((d, dateIdx) => {
      const colIdx = 3 + dateIdx;
      const cell = row.getCell(colIdx);
      cell.border = thinBorder;

      // Find active booking for this room & date
      const activeBooking = bookings.find((b) => {
        if (b.room_id !== room.id || b.status === 'cancelled') return false;
        return d.dateStr >= b.check_in && d.dateStr < b.check_out;
      });

      if (activeBooking) {
        const isCheckInDay = d.dateStr === activeBooking.check_in;
        const guestSnippet = activeBooking.guest_name.split(' ')[0] || 'Гость';
        const phoneSnippet = activeBooking.guest_phone ? activeBooking.guest_phone.slice(-5) : '';

        // Text inside cell
        cell.value = isCheckInDay
          ? `[Заезд] ${guestSnippet} (${phoneSnippet})`
          : `${guestSnippet} (${phoneSnippet})`;

        // Color coding by status
        if (activeBooking.status === 'checked_in') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.statusCheckedInBg } };
          cell.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: PALETTE.statusCheckedInFg } };
        } else if (activeBooking.status === 'checked_out') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.statusCheckedOutBg } };
          cell.font = { name: 'Calibri', size: 8.5, bold: false, color: { argb: PALETTE.statusCheckedOutFg } };
        } else {
          // Confirmed
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.statusConfirmedBg } };
          cell.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: PALETTE.statusConfirmedFg } };
        }

        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      } else {
        // Free cell
        cell.value = null;
        if (d.isWeekend) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.weekendCell } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: roomIdx % 2 === 0 ? 'FFFFFFFF' : 'FFFBFBFB' } };
        }
      }
    });
  });

  // Summary Rows below rooms
  const spacerRow = ws.getRow(lastRoomRow + 1);
  spacerRow.height = 8;

  // Row: Occupied Rooms Count
  const occupiedRowIdx = lastRoomRow + 2;
  const occupiedRow = ws.getRow(occupiedRowIdx);
  occupiedRow.height = 24;

  const occLabel = occupiedRow.getCell(1);
  occLabel.value = 'Занято номеров (ед.)';
  occLabel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.textMain } };
  occLabel.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  occLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };
  occLabel.border = thinBorder;

  const occPricePlaceholder = occupiedRow.getCell(2);
  occPricePlaceholder.value = '—';
  occPricePlaceholder.alignment = { vertical: 'middle', horizontal: 'center' };
  occPricePlaceholder.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };
  occPricePlaceholder.border = thinBorder;

  dates.forEach((_, dateIdx) => {
    const colIdx = 3 + dateIdx;
    const colLetter = getColumnLetter(colIdx);
    const cell = occupiedRow.getCell(colIdx);
    // Excel formula: count occupied cells in this date column
    cell.value = {
      formula: `COUNTA(${colLetter}${firstRoomRow}:${colLetter}${lastRoomRow})`,
      result: 0,
    };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.primaryDark } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };
    cell.border = thinBorder;
    cell.numFmt = '0';
  });

  // Row: Daily Occupancy %
  const rateRowIdx = lastRoomRow + 3;
  const rateRow = ws.getRow(rateRowIdx);
  rateRow.height = 24;

  const rateLabel = rateRow.getCell(1);
  rateLabel.value = '% загрузки дня';
  rateLabel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.textMain } };
  rateLabel.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  rateLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primarySubtle } };
  rateLabel.border = doubleBorderBottom;

  const ratePricePlaceholder = rateRow.getCell(2);
  ratePricePlaceholder.value = '—';
  ratePricePlaceholder.alignment = { vertical: 'middle', horizontal: 'center' };
  ratePricePlaceholder.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primarySubtle } };
  ratePricePlaceholder.border = doubleBorderBottom;

  dates.forEach((_, dateIdx) => {
    const colIdx = 3 + dateIdx;
    const colLetter = getColumnLetter(colIdx);
    const cell = rateRow.getCell(colIdx);
    // Excel formula: count / total rooms
    cell.value = {
      formula: `${colLetter}${occupiedRowIdx}/${rooms.length}`,
      result: 0,
    };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.primary } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primarySubtle } };
    cell.border = doubleBorderBottom;
    cell.numFmt = '0.0%';
  });

  // Legend at bottom
  const legendRowIdx = rateRowIdx + 2;
  const legendRow = ws.getRow(legendRowIdx);
  legendRow.height = 20;
  const legendCell = legendRow.getCell(1);
  legendCell.value = 'Обозначения:';
  legendCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: PALETTE.textMuted } };

  const l1 = legendRow.getCell(2);
  l1.value = 'Подтверждено';
  l1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.statusConfirmedBg } };
  l1.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: PALETTE.statusConfirmedFg } };
  l1.alignment = { vertical: 'middle', horizontal: 'center' };
  l1.border = thinBorder;

  const l2 = legendRow.getCell(3);
  l2.value = 'Заселен';
  l2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.statusCheckedInBg } };
  l2.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: PALETTE.statusCheckedInFg } };
  l2.alignment = { vertical: 'middle', horizontal: 'center' };
  l2.border = thinBorder;

  const l3 = legendRow.getCell(4);
  l3.value = 'Выходной день';
  l3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.bgWeekend } };
  l3.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: PALETTE.primaryDark } };
  l3.alignment = { vertical: 'middle', horizontal: 'center' };
  l3.border = thinBorder;

  // Set explicit column widths
  ws.getColumn(1).width = 24; // Room title
  ws.getColumn(2).width = 14; // Base price
  dates.forEach((_, idx) => {
    ws.getColumn(3 + idx).width = 13.5; // Date columns
  });
}

/**
 * SHEET 2: «Реестр бронирований» (Bookings Registry)
 */
function buildBookingsRegistrySheet(
  workbook: ExcelJS.Workbook,
  rooms: Room[],
  bookings: Booking[],
  settings: HotelSettings,
  startDate: string,
  endDate: string
) {
  const ws = workbook.addWorksheet('Реестр бронирований', {
    properties: { tabColor: { argb: 'FF2563EB' } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }],
  });

  applyBrandedHeader(ws, 'Реестр бронирований отеля', settings, startDate, endDate, 16);

  // Column definitions
  const columns = [
    { header: '№ Брони', key: 'booking_number', width: 16 },
    { header: 'Дата создания', key: 'created_at', width: 14 },
    { header: 'Номер / Категория', key: 'room_title', width: 24 },
    { header: 'ФИО гостя', key: 'guest_name', width: 22 },
    { header: 'Телефон', key: 'guest_phone', width: 18 },
    { header: 'Email', key: 'guest_email', width: 22 },
    { header: 'Заезд', key: 'check_in', width: 13 },
    { header: 'Выезд', key: 'check_out', width: 13 },
    { header: 'Ночей', key: 'nights', width: 10 },
    { header: 'Взр.', key: 'adults', width: 8 },
    { header: 'Дет.', key: 'children', width: 8 },
    { header: 'Тариф', key: 'tariff', width: 18 },
    { header: 'Статус брони', key: 'status', width: 16 },
    { header: 'Статус оплаты', key: 'payment_status', width: 18 },
    { header: 'Сумма (₽)', key: 'total_price', width: 16 },
    { header: 'Примечание', key: 'notes', width: 28 },
  ];

  // Row 5: Table Header
  const headerRow = ws.getRow(5);
  headerRow.height = 28;

  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: PALETTE.textWhite } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primary } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder;
    ws.getColumn(idx + 1).width = col.width;
  });

  // Filter bookings for period
  const filteredBookings = bookings.filter((b) => b.check_in <= endDate && b.check_out >= startDate);

  const startDataRow = 6;
  filteredBookings.forEach((b, idx) => {
    const rowIdx = startDataRow + idx;
    const row = ws.getRow(rowIdx);
    row.height = 24;

    const nights = Math.max(1, Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000));
    const room = rooms.find((r) => r.id === b.room_id);
    const roomTitle = b.room_title || (room ? room.title : `Номер #${b.room_id}`);

    const statusMap: Record<string, { label: string; bg: string; fg: string }> = {
      confirmed: { label: 'Подтверждено', bg: PALETTE.statusConfirmedBg, fg: PALETTE.statusConfirmedFg },
      checked_in: { label: 'Заселен', bg: PALETTE.statusCheckedInBg, fg: PALETTE.statusCheckedInFg },
      checked_out: { label: 'Выехал', bg: PALETTE.statusCheckedOutBg, fg: PALETTE.statusCheckedOutFg },
      cancelled: { label: 'Аннулировано', bg: PALETTE.statusCancelledBg, fg: PALETTE.statusCancelledFg },
    };

    const paymentMap: Record<string, { label: string; bg: string; fg: string }> = {
      paid: { label: 'Оплачено', bg: PALETTE.statusConfirmedBg, fg: PALETTE.statusConfirmedFg },
      pending_arrival: { label: 'Оплата на стойке', bg: PALETTE.statusPendingBg, fg: PALETTE.statusPendingFg },
      refunded: { label: 'Возврат', bg: PALETTE.statusCancelledBg, fg: PALETTE.statusCancelledFg },
    };

    const statusInfo = statusMap[b.status] || { label: b.status, bg: 'FFFFFFFF', fg: PALETTE.textMain };
    const paymentInfo = paymentMap[b.payment_status] || { label: b.payment_status, bg: 'FFFFFFFF', fg: PALETTE.textMain };

    const zebraBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAF9';

    // Col 1: Booking Number
    const c1 = row.getCell(1);
    c1.value = b.booking_number;
    c1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.primary } };
    c1.alignment = { vertical: 'middle', horizontal: 'center' };
    c1.border = thinBorder;
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // Col 2: Created At
    const c2 = row.getCell(2);
    c2.value = formatDateRu(b.created_at);
    c2.alignment = { vertical: 'middle', horizontal: 'center' };
    c2.border = thinBorder;
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // Col 3: Room Title
    const c3 = row.getCell(3);
    c3.value = roomTitle;
    c3.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.textMain } };
    c3.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    c3.border = thinBorder;
    c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // Col 4: Guest Name
    const c4 = row.getCell(4);
    c4.value = b.guest_name;
    c4.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    c4.border = thinBorder;
    c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // Col 5: Guest Phone
    const c5 = row.getCell(5);
    c5.value = b.guest_phone;
    c5.alignment = { vertical: 'middle', horizontal: 'center' };
    c5.border = thinBorder;
    c5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // Col 6: Guest Email
    const c6 = row.getCell(6);
    c6.value = b.guest_email || '—';
    c6.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    c6.border = thinBorder;
    c6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // Col 7: Check-In
    const c7 = row.getCell(7);
    c7.value = formatDateRu(b.check_in);
    c7.alignment = { vertical: 'middle', horizontal: 'center' };
    c7.border = thinBorder;
    c7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // Col 8: Check-Out
    const c8 = row.getCell(8);
    c8.value = formatDateRu(b.check_out);
    c8.alignment = { vertical: 'middle', horizontal: 'center' };
    c8.border = thinBorder;
    c8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // Col 9: Nights
    const c9 = row.getCell(9);
    c9.value = nights;
    c9.numFmt = '#,##0';
    c9.alignment = { vertical: 'middle', horizontal: 'center' };
    c9.border = thinBorder;
    c9.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // Col 10: Adults
    const c10 = row.getCell(10);
    c10.value = b.adults;
    c10.alignment = { vertical: 'middle', horizontal: 'center' };
    c10.border = thinBorder;
    c10.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // Col 11: Children
    const c11 = row.getCell(11);
    c11.value = b.children || 0;
    c11.alignment = { vertical: 'middle', horizontal: 'center' };
    c11.border = thinBorder;
    c11.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // Col 12: Tariff
    const c12 = row.getCell(12);
    c12.value = b.tariff_type === 'breakfast' ? 'С завтраком' : 'Основной (без питания)';
    c12.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    c12.border = thinBorder;
    c12.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // Col 13: Status
    const c13 = row.getCell(13);
    c13.value = statusInfo.label;
    c13.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: statusInfo.fg } };
    c13.alignment = { vertical: 'middle', horizontal: 'center' };
    c13.border = thinBorder;
    c13.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusInfo.bg } };

    // Col 14: Payment Status
    const c14 = row.getCell(14);
    c14.value = paymentInfo.label;
    c14.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: paymentInfo.fg } };
    c14.alignment = { vertical: 'middle', horizontal: 'center' };
    c14.border = thinBorder;
    c14.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: paymentInfo.bg } };

    // Col 15: Total Price
    const c15 = row.getCell(15);
    c15.value = b.total_price;
    c15.numFmt = '#,##0 "₽"';
    c15.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.textMain } };
    c15.alignment = { vertical: 'middle', horizontal: 'right' };
    c15.border = thinBorder;
    c15.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // Col 16: Notes
    const c16 = row.getCell(16);
    c16.value = b.notes || (b.selected_services && b.selected_services.length > 0 ? `Услуги: ${b.selected_services.join(', ')}` : '—');
    c16.font = { name: 'Calibri', size: 9, color: { argb: PALETTE.textMuted } };
    c16.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    c16.border = thinBorder;
    c16.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
  });

  const lastDataRow = filteredBookings.length > 0 ? startDataRow + filteredBookings.length - 1 : startDataRow;

  // Set Excel native autoFilter across the full range
  ws.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: lastDataRow, column: 16 },
  };

  // Summary Row (ИТОГО)
  const totalRowIdx = lastDataRow + 1;
  const totalRow = ws.getRow(totalRowIdx);
  totalRow.height = 26;

  // Col 1: Label
  const tLabel = totalRow.getCell(1);
  tLabel.value = `ИТОГО (${filteredBookings.length} броней)`;
  tLabel.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: PALETTE.textMain } };
  tLabel.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  tLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };
  tLabel.border = doubleBorderBottom;

  // Fill in empty cells between Col 2 and 8
  for (let c = 2; c <= 8; c++) {
    const emptyCell = totalRow.getCell(c);
    emptyCell.value = '';
    emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };
    emptyCell.border = doubleBorderBottom;
  }

  // Col 9: Total Nights
  const tNights = totalRow.getCell(9);
  tNights.value = {
    formula: filteredBookings.length > 0 ? `SUM(I${startDataRow}:I${lastDataRow})` : '0',
    result: 0,
  };
  tNights.numFmt = '#,##0';
  tNights.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: PALETTE.primaryDark } };
  tNights.alignment = { vertical: 'middle', horizontal: 'center' };
  tNights.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };
  tNights.border = doubleBorderBottom;

  // Fill Col 10 to 14
  for (let c = 10; c <= 14; c++) {
    const emptyCell = totalRow.getCell(c);
    emptyCell.value = '';
    emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };
    emptyCell.border = doubleBorderBottom;
  }

  // Col 15: Total Price Sum
  const tSum = totalRow.getCell(15);
  tSum.value = {
    formula: filteredBookings.length > 0 ? `SUM(O${startDataRow}:O${lastDataRow})` : '0',
    result: 0,
  };
  tSum.numFmt = '#,##0 "₽"';
  tSum.font = { name: 'Calibri', size: 11, bold: true, color: { argb: PALETTE.primaryDark } };
  tSum.alignment = { vertical: 'middle', horizontal: 'right' };
  tSum.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };
  tSum.border = doubleBorderBottom;

  // Col 16: Empty end
  const tEnd = totalRow.getCell(16);
  tEnd.value = '';
  tEnd.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };
  tEnd.border = doubleBorderBottom;
}

/**
 * SHEET 3: «Заезды и Выезды» (Arrivals and Departures)
 */
function buildArrivalsDeparturesSheet(
  workbook: ExcelJS.Workbook,
  rooms: Room[],
  bookings: Booking[],
  settings: HotelSettings,
  startDate: string,
  endDate: string
) {
  const ws = workbook.addWorksheet('Заезды и выезды', {
    properties: { tabColor: { argb: 'FF16A34A' } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }],
  });

  applyBrandedHeader(ws, 'График заездов и выездов гостей', settings, startDate, endDate, 7);

  const arrivals = bookings.filter((b) => b.check_in >= startDate && b.check_in <= endDate && b.status !== 'cancelled');
  const departures = bookings.filter((b) => b.check_out >= startDate && b.check_out <= endDate && b.status !== 'cancelled');

  let currentRow = 5;

  // ================= SECTION 1: ARRIVALS =================
  const arrBanner = ws.getRow(currentRow);
  arrBanner.height = 28;
  ws.mergeCells(`A${currentRow}:G${currentRow}`);
  const arrBannerCell = ws.getCell(`A${currentRow}`);
  arrBannerCell.value = `1. ОЖИДАЕМЫЕ ЗАЕЗДЫ ЗА ПЕРИОД (${arrivals.length})`;
  arrBannerCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: PALETTE.textWhite } };
  arrBannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primary } };
  arrBannerCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  arrBannerCell.border = thinBorder;

  currentRow++;

  // Arrivals Header Row
  const arrHeaders = [
    { label: 'Дата / Время заезда', width: 22 },
    { label: 'Номер / Категория', width: 24 },
    { label: 'ФИО гостя', width: 24 },
    { label: 'Контакты гостя', width: 24 },
    { label: 'Сумма брони', width: 16 },
    { label: 'Оплата на стойке', width: 20 },
    { label: 'Особые отметки / Пожелания', width: 32 },
  ];

  const arrHeaderRow = ws.getRow(currentRow);
  arrHeaderRow.height = 24;
  arrHeaders.forEach((h, idx) => {
    const cell = arrHeaderRow.getCell(idx + 1);
    cell.value = h.label;
    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: PALETTE.primaryDark } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
    ws.getColumn(idx + 1).width = h.width;
  });

  currentRow++;

  if (arrivals.length === 0) {
    const emptyRow = ws.getRow(currentRow);
    emptyRow.height = 24;
    ws.mergeCells(`A${currentRow}:G${currentRow}`);
    const emptyCell = ws.getCell(`A${currentRow}`);
    emptyCell.value = 'Нет ожидаемых заездов в выбранный период';
    emptyCell.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: PALETTE.textMuted } };
    emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
    emptyCell.border = thinBorder;
    currentRow++;
  } else {
    arrivals.forEach((b, idx) => {
      const row = ws.getRow(currentRow);
      row.height = 24;
      const room = rooms.find((r) => r.id === b.room_id);
      const roomTitle = b.room_title || (room ? room.title : `Номер #${b.room_id}`);
      const isPaid = b.payment_status === 'paid';
      const zebraBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAF9';

      // 1: Check-in Date + Time
      const c1 = row.getCell(1);
      c1.value = `${formatDateRu(b.check_in)} (с ${settings.check_in_time || '14:00'})`;
      c1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.primary } };
      c1.alignment = { vertical: 'middle', horizontal: 'center' };
      c1.border = thinBorder;
      c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

      // 2: Room
      const c2 = row.getCell(2);
      c2.value = roomTitle;
      c2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.textMain } };
      c2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      c2.border = thinBorder;
      c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

      // 3: Guest Name
      const c3 = row.getCell(3);
      c3.value = b.guest_name;
      c3.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      c3.border = thinBorder;
      c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

      // 4: Contacts
      const c4 = row.getCell(4);
      c4.value = `${b.guest_phone}${b.guest_email ? ` | ${b.guest_email}` : ''}`;
      c4.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      c4.border = thinBorder;
      c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

      // 5: Price
      const c5 = row.getCell(5);
      c5.value = b.total_price;
      c5.numFmt = '#,##0 "₽"';
      c5.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.textMain } };
      c5.alignment = { vertical: 'middle', horizontal: 'right' };
      c5.border = thinBorder;
      c5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

      // 6: Payment Status & Action
      const c6 = row.getCell(6);
      c6.value = isPaid ? 'Оплачено онлайн' : 'К оплате на стойке';
      c6.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: isPaid ? PALETTE.statusConfirmedFg : PALETTE.statusPendingFg } };
      c6.alignment = { vertical: 'middle', horizontal: 'center' };
      c6.border = thinBorder;
      c6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isPaid ? PALETTE.statusConfirmedBg : PALETTE.statusPendingBg } };

      // 7: Special Notes
      const c7 = row.getCell(7);
      const notesList: string[] = [];
      if (b.tariff_type === 'breakfast') notesList.push('Завтрак включен');
      if (b.selected_services && b.selected_services.length > 0) notesList.push(`Услуги: ${b.selected_services.join(', ')}`);
      if (b.notes) notesList.push(b.notes);

      c7.value = notesList.length > 0 ? notesList.join(' | ') : 'Стандартный заезд';
      c7.font = { name: 'Calibri', size: 9, color: { argb: PALETTE.textMuted } };
      c7.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      c7.border = thinBorder;
      c7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

      currentRow++;
    });
  }

  // Spacer between sections
  ws.getRow(currentRow).height = 14;
  currentRow++;

  // ================= SECTION 2: DEPARTURES =================
  const depBanner = ws.getRow(currentRow);
  depBanner.height = 28;
  ws.mergeCells(`A${currentRow}:G${currentRow}`);
  const depBannerCell = ws.getCell(`A${currentRow}`);
  depBannerCell.value = `2. ОЖИДАЕМЫЕ ВЫЕЗДЫ ЗА ПЕРИОД (${departures.length})`;
  depBannerCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: PALETTE.textWhite } };
  depBannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3E6382' } }; // Warm Slate Blue
  depBannerCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  depBannerCell.border = thinBorder;

  currentRow++;

  // Departures Header Row
  const depHeaders = [
    'Дата / Время выезда',
    'Номер / Категория',
    'ФИО гостя',
    'Контакты гостя',
    'Сумма брони',
    'Статус оплаты',
    'Особые отметки / Клининг / Проверка номера',
  ];

  const depHeaderRow = ws.getRow(currentRow);
  depHeaderRow.height = 24;
  depHeaders.forEach((h, idx) => {
    const cell = depHeaderRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF1E293B' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDF3F7' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });

  currentRow++;

  if (departures.length === 0) {
    const emptyRow = ws.getRow(currentRow);
    emptyRow.height = 24;
    ws.mergeCells(`A${currentRow}:G${currentRow}`);
    const emptyCell = ws.getCell(`A${currentRow}`);
    emptyCell.value = 'Нет ожидаемых выездов в выбранный период';
    emptyCell.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: PALETTE.textMuted } };
    emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
    emptyCell.border = thinBorder;
  } else {
    departures.forEach((b, idx) => {
      const row = ws.getRow(currentRow);
      row.height = 24;
      const room = rooms.find((r) => r.id === b.room_id);
      const roomTitle = b.room_title || (room ? room.title : `Номер #${b.room_id}`);
      const isPaid = b.payment_status === 'paid';
      const zebraBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAF9';

      // 1: Check-out Date + Time
      const c1 = row.getCell(1);
      c1.value = `${formatDateRu(b.check_out)} (до ${settings.check_out_time || '12:00'})`;
      c1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF3E6382' } };
      c1.alignment = { vertical: 'middle', horizontal: 'center' };
      c1.border = thinBorder;
      c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

      // 2: Room
      const c2 = row.getCell(2);
      c2.value = roomTitle;
      c2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.textMain } };
      c2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      c2.border = thinBorder;
      c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

      // 3: Guest Name
      const c3 = row.getCell(3);
      c3.value = b.guest_name;
      c3.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      c3.border = thinBorder;
      c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

      // 4: Contacts
      const c4 = row.getCell(4);
      c4.value = b.guest_phone;
      c4.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      c4.border = thinBorder;
      c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

      // 5: Price
      const c5 = row.getCell(5);
      c5.value = b.total_price;
      c5.numFmt = '#,##0 "₽"';
      c5.font = { name: 'Calibri', size: 10, color: { argb: PALETTE.textMain } };
      c5.alignment = { vertical: 'middle', horizontal: 'right' };
      c5.border = thinBorder;
      c5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

      // 6: Payment Status
      const c6 = row.getCell(6);
      c6.value = isPaid ? 'Полностью оплачено' : 'Требуется расчет на стойке';
      c6.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: isPaid ? PALETTE.statusConfirmedFg : PALETTE.statusPendingFg } };
      c6.alignment = { vertical: 'middle', horizontal: 'center' };
      c6.border = thinBorder;
      c6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isPaid ? PALETTE.statusConfirmedBg : PALETTE.statusPendingBg } };

      // 7: Cleaning Notes
      const c7 = row.getCell(7);
      c7.value = 'Требуется полная смена белья и генеральный клининг' + (b.notes ? ` | ${b.notes}` : '');
      c7.font = { name: 'Calibri', size: 9, color: { argb: PALETTE.textMuted } };
      c7.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      c7.border = thinBorder;
      c7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

      currentRow++;
    });
  }
}

/**
 * SHEET 4: «Сводка и KPI» (Summary & KPI)
 */
function buildKpiSummarySheet(
  workbook: ExcelJS.Workbook,
  rooms: Room[],
  bookings: Booking[],
  settings: HotelSettings,
  startDate: string,
  endDate: string
) {
  const ws = workbook.addWorksheet('Сводка и KPI', {
    properties: { tabColor: { argb: 'FF854D0E' } },
  });

  applyBrandedHeader(ws, 'Сводка ключевых показателей отеля (KPI)', settings, startDate, endDate, 7);

  // Period calculation
  const dates = getDatesInRange(startDate, endDate);
  const daysCount = dates.length;
  const availableRoomNights = rooms.length * daysCount;

  // Active bookings overlapping the period
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled' && b.check_in <= endDate && b.check_out >= startDate);

  // Room nights sold in period
  let totalSoldNights = 0;
  let totalPeriodRevenue = 0;

  activeBookings.forEach((b) => {
    const totalNights = Math.max(1, Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000));
    // Overlapping dates
    const overlapStart = new Date(Math.max(new Date(b.check_in).getTime(), new Date(startDate).getTime()));
    const overlapEnd = new Date(Math.min(new Date(b.check_out).getTime(), new Date(endDate).getTime() + 86400000));
    const overlapNights = Math.max(0, Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000));

    totalSoldNights += overlapNights;
    const dailyRate = b.total_price / totalNights;
    totalPeriodRevenue += dailyRate * overlapNights;
  });

  totalPeriodRevenue = Math.round(totalPeriodRevenue);
  const avgOccupancy = availableRoomNights > 0 ? totalSoldNights / availableRoomNights : 0;
  const adr = totalSoldNights > 0 ? Math.round(totalPeriodRevenue / totalSoldNights) : 0;
  const revpar = availableRoomNights > 0 ? Math.round(totalPeriodRevenue / availableRoomNights) : 0;
  const avgCheck = activeBookings.length > 0 ? Math.round(totalPeriodRevenue / activeBookings.length) : 0;

  // KPI Section Banner
  let curRow = 5;
  const kpiBanner = ws.getRow(curRow);
  kpiBanner.height = 28;
  ws.mergeCells(`A${curRow}:G${curRow}`);
  const kpiBannerCell = ws.getCell(`A${curRow}`);
  kpiBannerCell.value = 'КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ ЭФФЕКТИВНОСТИ (KPI)';
  kpiBannerCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: PALETTE.textWhite } };
  kpiBannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primary } };
  kpiBannerCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  kpiBannerCell.border = thinBorder;

  curRow++;

  // KPI Table Headers
  const kpiHeaderRow = ws.getRow(curRow);
  kpiHeaderRow.height = 24;
  const kHeaders = ['Показатель эффективности', 'Значение', 'Ед. изм.', 'Методика расчета и описание'];
  ws.mergeCells(`D${curRow}:G${curRow}`);

  kHeaders.forEach((h, idx) => {
    const colIdx = idx === 3 ? 4 : idx + 1;
    const cell = kpiHeaderRow.getCell(colIdx);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: PALETTE.primaryDark } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };
    cell.alignment = { vertical: 'middle', horizontal: idx === 1 ? 'right' : 'left', indent: 1 };
    cell.border = thinBorder;
  });

  curRow++;

  const kpis = [
    {
      title: 'Общая выручка за период',
      val: totalPeriodRevenue,
      unit: '₽',
      fmt: '#,##0 "₽"',
      desc: 'Суммарный доход от проживания гостей за выбранный период (с учетом распределения по дням)',
    },
    {
      title: 'Продано номеро-ночей',
      val: totalSoldNights,
      unit: 'ночей',
      fmt: '#,##0',
      desc: 'Фактическое количество ночей проживания гостей во всех номерах за период',
    },
    {
      title: 'Доступно номеро-ночей',
      val: availableRoomNights,
      unit: 'ночей',
      fmt: '#,##0',
      desc: `Максимальная емкость отеля: ${rooms.length} номеров × ${daysCount} календарных дней`,
    },
    {
      title: 'Средняя загрузка отеля (Occupancy Rate)',
      val: avgOccupancy,
      unit: '%',
      fmt: '0.0%',
      desc: 'Отношение проданных номеро-ночей к доступным за период (Продано / Доступно)',
    },
    {
      title: 'ADR (Average Daily Rate)',
      val: adr,
      unit: '₽/ночь',
      fmt: '#,##0 "₽"',
      desc: 'Средняя цена продажи одного номера за ночь (Выручка / Продано ночей)',
    },
    {
      title: 'RevPAR (Revenue Per Available Room)',
      val: revpar,
      unit: '₽/ночь',
      fmt: '#,##0 "₽"',
      desc: 'Доходность одного доступного номера в сутки (Выручка / Доступно номеро-ночей)',
    },
    {
      title: 'Всего бронирований за период',
      val: activeBookings.length,
      unit: 'броней',
      fmt: '#,##0',
      desc: 'Количество бронирований, затрагивающих выбранный период',
    },
    {
      title: 'Средний чек бронирования (AOV)',
      val: avgCheck,
      unit: '₽',
      fmt: '#,##0 "₽"',
      desc: 'Средняя стоимость одной брони отеля (Выручка / Количество броней)',
    },
  ];

  kpis.forEach((kpi, idx) => {
    const row = ws.getRow(curRow);
    row.height = 24;
    const zebraBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAF9';

    // 1: Title
    const c1 = row.getCell(1);
    c1.value = kpi.title;
    c1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.textMain } };
    c1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    c1.border = thinBorder;
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // 2: Value
    const c2 = row.getCell(2);
    c2.value = kpi.val;
    c2.numFmt = kpi.fmt;
    c2.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: PALETTE.primary } };
    c2.alignment = { vertical: 'middle', horizontal: 'right' };
    c2.border = thinBorder;
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // 3: Unit
    const c3 = row.getCell(3);
    c3.value = kpi.unit;
    c3.font = { name: 'Calibri', size: 9.5, color: { argb: PALETTE.textMuted } };
    c3.alignment = { vertical: 'middle', horizontal: 'center' };
    c3.border = thinBorder;
    c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // 4..7: Desc (Merged)
    ws.mergeCells(`D${curRow}:G${curRow}`);
    const c4 = row.getCell(4);
    c4.value = kpi.desc;
    c4.font = { name: 'Calibri', size: 9, italic: true, color: { argb: PALETTE.textMuted } };
    c4.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    c4.border = thinBorder;
    c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    curRow++;
  });

  // Spacer
  ws.getRow(curRow).height = 14;
  curRow++;

  // ================= ROOM BREAKDOWN TABLE =================
  const catBanner = ws.getRow(curRow);
  catBanner.height = 28;
  ws.mergeCells(`A${curRow}:G${curRow}`);
  const catBannerCell = ws.getCell(`A${curRow}`);
  catBannerCell.value = 'ДОХОДНОСТЬ И ЗАГРУЗКА ПО КАТЕГОРИЯМ НОМЕРОВ';
  catBannerCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: PALETTE.textWhite } };
  catBannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryDark } };
  catBannerCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  catBannerCell.border = thinBorder;

  curRow++;

  // Category Table Header Row
  const catHeaders = [
    { label: 'Номер / Категория', width: 26 },
    { label: 'Базовая цена', width: 15 },
    { label: 'Кол-во броней', width: 14 },
    { label: 'Продано ночей', width: 15 },
    { label: 'Выручка (₽)', width: 16 },
    { label: 'Загрузка (%)', width: 15 },
    { label: 'Доля в выручке (%)', width: 18 },
  ];

  const catHeaderRow = ws.getRow(curRow);
  catHeaderRow.height = 24;
  catHeaders.forEach((h, idx) => {
    const cell = catHeaderRow.getCell(idx + 1);
    cell.value = h.label;
    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: PALETTE.primaryDark } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
    ws.getColumn(idx + 1).width = h.width;
  });

  const catStartRow = curRow + 1;
  curRow++;

  rooms.forEach((room, idx) => {
    const row = ws.getRow(curRow);
    row.height = 24;
    const zebraBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAF9';

    // Room specific stats
    const roomBookings = activeBookings.filter((b) => b.room_id === room.id);
    let roomSoldNights = 0;
    let roomRevenue = 0;

    roomBookings.forEach((b) => {
      const totalNights = Math.max(1, Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000));
      const overlapStart = new Date(Math.max(new Date(b.check_in).getTime(), new Date(startDate).getTime()));
      const overlapEnd = new Date(Math.min(new Date(b.check_out).getTime(), new Date(endDate).getTime() + 86400000));
      const overlapNights = Math.max(0, Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000));
      roomSoldNights += overlapNights;
      roomRevenue += (b.total_price / totalNights) * overlapNights;
    });

    roomRevenue = Math.round(roomRevenue);

    // 1: Room Title
    const c1 = row.getCell(1);
    c1.value = room.title;
    c1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.textMain } };
    c1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    c1.border = thinBorder;
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // 2: Base Price
    const c2 = row.getCell(2);
    c2.value = room.price_base;
    c2.numFmt = '#,##0 "₽"';
    c2.alignment = { vertical: 'middle', horizontal: 'right' };
    c2.border = thinBorder;
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // 3: Bookings Count
    const c3 = row.getCell(3);
    c3.value = roomBookings.length;
    c3.numFmt = '#,##0';
    c3.alignment = { vertical: 'middle', horizontal: 'center' };
    c3.border = thinBorder;
    c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // 4: Sold Nights
    const c4 = row.getCell(4);
    c4.value = roomSoldNights;
    c4.numFmt = '#,##0';
    c4.alignment = { vertical: 'middle', horizontal: 'center' };
    c4.border = thinBorder;
    c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // 5: Revenue
    const c5 = row.getCell(5);
    c5.value = roomRevenue;
    c5.numFmt = '#,##0 "₽"';
    c5.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETTE.textMain } };
    c5.alignment = { vertical: 'middle', horizontal: 'right' };
    c5.border = thinBorder;
    c5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // 6: Occupancy Formula: D{row} / daysCount
    const c6 = row.getCell(6);
    c6.value = {
      formula: `D${curRow}/${daysCount}`,
      result: daysCount > 0 ? roomSoldNights / daysCount : 0,
    };
    c6.numFmt = '0.0%';
    c6.alignment = { vertical: 'middle', horizontal: 'center' };
    c6.border = thinBorder;
    c6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    // 7: Share of Revenue: E{row} / $E${totalRow}
    const catTotalRowIdx = catStartRow + rooms.length;
    const c7 = row.getCell(7);
    c7.value = {
      formula: `E${curRow}/$E$${catTotalRowIdx}`,
      result: totalPeriodRevenue > 0 ? roomRevenue / totalPeriodRevenue : 0,
    };
    c7.numFmt = '0.0%';
    c7.alignment = { vertical: 'middle', horizontal: 'center' };
    c7.border = thinBorder;
    c7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };

    curRow++;
  });

  const catEndRow = curRow - 1;

  // Total Summary Row
  const catTotalRow = ws.getRow(curRow);
  catTotalRow.height = 26;

  // 1: Label
  const t1 = catTotalRow.getCell(1);
  t1.value = 'ИТОГО ПО ОТЕЛЮ';
  t1.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: PALETTE.textMain } };
  t1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  t1.border = doubleBorderBottom;
  t1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };

  // 2: Placeholder
  const t2 = catTotalRow.getCell(2);
  t2.value = '—';
  t2.alignment = { vertical: 'middle', horizontal: 'center' };
  t2.border = doubleBorderBottom;
  t2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };

  // 3: Total Bookings
  const t3 = catTotalRow.getCell(3);
  t3.value = {
    formula: `SUM(C${catStartRow}:C${catEndRow})`,
    result: activeBookings.length,
  };
  t3.numFmt = '#,##0';
  t3.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: PALETTE.primaryDark } };
  t3.alignment = { vertical: 'middle', horizontal: 'center' };
  t3.border = doubleBorderBottom;
  t3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };

  // 4: Total Sold Nights
  const t4 = catTotalRow.getCell(4);
  t4.value = {
    formula: `SUM(D${catStartRow}:D${catEndRow})`,
    result: totalSoldNights,
  };
  t4.numFmt = '#,##0';
  t4.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: PALETTE.primaryDark } };
  t4.alignment = { vertical: 'middle', horizontal: 'center' };
  t4.border = doubleBorderBottom;
  t4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };

  // 5: Total Revenue
  const t5 = catTotalRow.getCell(5);
  t5.value = {
    formula: `SUM(E${catStartRow}:E${catEndRow})`,
    result: totalPeriodRevenue,
  };
  t5.numFmt = '#,##0 "₽"';
  t5.font = { name: 'Calibri', size: 11, bold: true, color: { argb: PALETTE.primaryDark } };
  t5.alignment = { vertical: 'middle', horizontal: 'right' };
  t5.border = doubleBorderBottom;
  t5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };

  // 6: Total Occupancy %: D{total} / (rooms.length * daysCount)
  const t6 = catTotalRow.getCell(6);
  t6.value = {
    formula: `D${curRow}/(${rooms.length}*${daysCount})`,
    result: avgOccupancy,
  };
  t6.numFmt = '0.0%';
  t6.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: PALETTE.primaryDark } };
  t6.alignment = { vertical: 'middle', horizontal: 'center' };
  t6.border = doubleBorderBottom;
  t6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };

  // 7: 100.0%
  const t7 = catTotalRow.getCell(7);
  t7.value = 1.0;
  t7.numFmt = '0.0%';
  t7.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: PALETTE.primaryDark } };
  t7.alignment = { vertical: 'middle', horizontal: 'center' };
  t7.border = doubleBorderBottom;
  t7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.primaryTint } };

  autoFitColumns(ws, 14, 40);
}

/**
 * Main export function: generates real OpenXML .xlsx workbook and triggers browser download
 */
/**
 * Builds the complete multi-sheet ExcelJS.Workbook instance
 */
export async function createHotelReportWorkbook(options: ExportOptions): Promise<ExcelJS.Workbook> {
  const { rooms, bookings, settings, startDate, endDate, includedSheets } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = settings.hotel_name || 'Гостиница «Победа» (г. Феодосия)';
  workbook.lastModifiedBy = 'АИС Гостиница Победа';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Chessboard (Шахматка)
  if (includedSheets.chessboard) {
    buildChessboardSheet(workbook, rooms, bookings, settings, startDate, endDate);
  }

  // 2. Bookings Registry (Реестр бронирований)
  if (includedSheets.bookingsRegistry) {
    buildBookingsRegistrySheet(workbook, rooms, bookings, settings, startDate, endDate);
  }

  // 3. Arrivals & Departures (Заезды и выезды)
  if (includedSheets.arrivalsDepartures) {
    buildArrivalsDeparturesSheet(workbook, rooms, bookings, settings, startDate, endDate);
  }

  // 4. KPI Summary (Сводка и KPI)
  if (includedSheets.kpiSummary) {
    buildKpiSummarySheet(workbook, rooms, bookings, settings, startDate, endDate);
  }

  // Safety: at least one sheet must exist
  if (workbook.worksheets.length === 0) {
    throw new Error('Не выбрано ни одного листа для включения в отчет');
  }

  return workbook;
}

/**
 * Main export function: generates real OpenXML .xlsx workbook and triggers browser download
 */
export async function generateHotelReport(options: ExportOptions): Promise<void> {
  const workbook = await createHotelReportWorkbook(options);

  // Write binary buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Trigger download in browser environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const fileName = `Pobeda_Hotel_Otchet_${options.startDate}_${options.endDate}.xlsx`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

