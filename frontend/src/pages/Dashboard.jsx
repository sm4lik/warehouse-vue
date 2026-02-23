import { useState, useEffect } from 'react';
import { materialsAPI, suppliesAPI } from '../api';
import Layout from '../components/Layout';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMaterials: 0,
    totalSupplies: 0,
    lowStock: 0,
    totalValue: 0
  });
  const [recentSupplies, setRecentSupplies] = useState([]);
  const [lowStockMaterials, setLowStockMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [materialsRes, suppliesRes] = await Promise.all([
        materialsAPI.getAll(),
        suppliesAPI.getAll()
      ]);

      const materials = materialsRes.data.materials;
      const supplies = suppliesRes.data.supplies;

      const lowStock = materials.filter(m => m.min_quantity > 0 && m.quantity <= m.min_quantity);
      
      setStats({
        totalMaterials: materials.length,
        totalSupplies: supplies.length,
        lowStock: lowStock.length,
        totalValue: materials.reduce((sum, m) => sum + parseFloat(m.quantity), 0)
      });

      setLowStockMaterials(lowStock.slice(0, 5));
      setRecentSupplies(supplies.slice(0, 5));
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <i className='bx bx-loader-alt animate-spin text-5xl text-blue-600'></i>
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-8">
          <div className="page-header">
            <div>
              <h1 className="page-title">Обзор склада</h1>
              <p className="text-gray-500 mt-1">Актуальная информация о состоянии склада</p>
            </div>
          </div>

          {/* Карточки статистики */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="stats-card border-l-4 border-l-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stats-card-label">Всего материалов</p>
                  <p className="stats-card-value">{stats.totalMaterials}</p>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <i className='bx bx-package text-2xl text-blue-600'></i>
                </div>
              </div>
            </div>
            
            <div className="stats-card border-l-4 border-l-emerald-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stats-card-label">Поставок</p>
                  <p className="stats-card-value">{stats.totalSupplies}</p>
                </div>
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <i className='bx bx-detail text-2xl text-emerald-600'></i>
                </div>
              </div>
            </div>
            
            <div className="stats-card border-l-4 border-l-amber-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stats-card-label">Заканчивается</p>
                  <p className="stats-card-value">{stats.lowStock}</p>
                </div>
                <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                  <i className='bx bx-error text-2xl text-amber-600'></i>
                </div>
              </div>
            </div>
            
            <div className="stats-card border-l-4 border-l-purple-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stats-card-label">Общее количество</p>
                  <p className="stats-card-value">{stats.totalValue.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">единиц</p>
                </div>
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                  <i className='bx bx-bar-chart-alt text-2xl text-purple-600'></i>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Материалы с низким остатком */}
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className='bx bx-error-circle text-amber-500 text-xl'></i>
                  <span className="font-semibold text-gray-900">Заканчивающиеся материалы</span>
                </div>
              </div>
              <div className="card-body">
                {lowStockMaterials.length === 0 ? (
                  <div className="text-center py-8">
                    <i className='bx bx-check-circle text-5xl text-emerald-500 mb-3'></i>
                    <p className="text-gray-500">Все материалы в наличии</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Наименование</th>
                          <th>Остаток</th>
                          <th>Мин.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockMaterials.map(material => (
                          <tr key={material.id}>
                            <td className="font-medium">{material.name}</td>
                            <td>
                              <span className="badge badge-danger">{material.quantity} {material.unit_short}</span>
                            </td>
                            <td className="text-gray-500">{material.min_quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Последние поставки */}
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className='bx bx-detail text-blue-500 text-xl'></i>
                  <span className="font-semibold text-gray-900">Последние поставки</span>
                </div>
              </div>
              <div className="card-body">
                {recentSupplies.length === 0 ? (
                  <div className="text-center py-8">
                    <i className='bx bx-inbox text-5xl text-gray-300 mb-3'></i>
                    <p className="text-gray-500">Поставок пока нет</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Документ</th>
                          <th>Поставщик</th>
                          <th>Дата</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSupplies.map(supply => (
                          <tr key={supply.id}>
                            <td className="font-medium text-blue-600">{supply.document_number}</td>
                            <td className="text-gray-700">{supply.supplier}</td>
                            <td className="text-gray-500">
                              {new Date(supply.supply_date).toLocaleDateString('ru-RU')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
