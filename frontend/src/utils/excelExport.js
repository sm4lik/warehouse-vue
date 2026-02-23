import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportMaterialsToExcel = async (materials) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Warehouse System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Материалы');

  // Настройка колонок
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Наименование', key: 'name', width: 30 },
    { header: 'Количество', key: 'quantity', width: 15 },
    { header: 'Ед. изм.', key: 'unit_short', width: 10 },
    { header: 'Мин. остаток', key: 'min_quantity', width: 15 },
    { header: 'Комментарий', key: 'comment', width: 30 }
  ];

  // Стили заголовка
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF667EEA' }
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

  // Добавление данных
  materials.forEach(material => {
    worksheet.addRow({
      id: material.id,
      name: material.name,
      quantity: material.quantity,
      unit_short: material.unit_short,
      min_quantity: material.min_quantity,
      comment: material.comment || ''
    });
  });

  // Генерация файла
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  
  const fileName = `Материалы_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, fileName);
};

export const exportTransactionsToExcel = async (transactions) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Warehouse System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Транзакции');

  // Настройка колонок
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Дата', key: 'created_at', width: 20 },
    { header: 'Материал', key: 'material_name', width: 30 },
    { header: 'Тип', key: 'transaction_type', width: 12 },
    { header: 'Количество', key: 'quantity', width: 15 },
    { header: 'Ед. изм.', key: 'unit_short', width: 10 },
    { header: 'Пользователь', key: 'full_name', width: 25 },
    { header: 'Получатель', key: 'recipient_name', width: 25 },
    { header: 'Документ', key: 'document_number', width: 20 },
    { header: 'Комментарий', key: 'comment', width: 30 }
  ];

  // Стили заголовка
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF667EEA' }
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

  // Добавление данных
  transactions.forEach(t => {
    worksheet.addRow({
      id: t.id,
      created_at: new Date(t.created_at).toLocaleString('ru-RU'),
      material_name: t.material_name,
      transaction_type: t.transaction_type === 'in' ? 'Приход' : 'Списание',
      quantity: t.quantity,
      unit_short: t.unit_short,
      full_name: t.full_name || t.username,
      recipient_name: t.recipient_name || t.recipient_username || '-',
      document_number: t.document_number || '-',
      comment: t.comment || ''
    });
  });

  // Генерация файла
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  
  const fileName = `Транзакции_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, fileName);
};

export const exportSuppliesToExcel = async (supplies) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Warehouse System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Поставки');

  // Настройка колонок
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Документ', key: 'document_number', width: 20 },
    { header: 'Поставщик', key: 'supplier', width: 30 },
    { header: 'Покупатель', key: 'buyer', width: 30 },
    { header: 'Получатель', key: 'receiver', width: 30 },
    { header: 'Дата', key: 'supply_date', width: 15 },
    { header: 'Комментарий', key: 'comment', width: 30 },
    { header: 'Создал', key: 'creator_name', width: 25 }
  ];

  // Стили заголовка
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF667EEA' }
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

  // Добавление данных
  supplies.forEach(supply => {
    worksheet.addRow({
      id: supply.id,
      document_number: supply.document_number,
      supplier: supply.supplier,
      buyer: supply.buyer,
      receiver: supply.receiver,
      supply_date: new Date(supply.supply_date).toLocaleDateString('ru-RU'),
      comment: supply.comment || '',
      creator_name: supply.creator_name || supply.creator_full_name
    });
  });

  // Генерация файла
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  
  const fileName = `Поставки_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, fileName);
};

export default {
  exportMaterialsToExcel,
  exportTransactionsToExcel,
  exportSuppliesToExcel
};
