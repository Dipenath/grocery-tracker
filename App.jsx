import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, Download, TrendingUp, Sun, Moon, Mic, Lock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function GroceryTracker() {
  const [items, setItems] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', qty: '1', unit: 'kg' });

  useEffect(() => {
    const saved = localStorage.getItem('groceryData');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('groceryData', JSON.stringify(items));
  }, [items]);

  const totalSpending = items.reduce((acc, curr) => acc + curr.total, 0);

  // Voice Recognition Logic
  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Not supported");
    const rec = new SpeechRecognition();
    rec.onstart = () => setIsListening(true);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript.toLowerCase();
      const priceMatch = text.match(/\d+/);
      const price = priceMatch ? priceMatch[0] : "";
      const name = text.replace(price, "").replace("rupees", "").trim();
      setForm({ ...form, name, price });
      setIsModalOpen(true);
    };
    rec.onend = () => setIsListening(false);
    rec.start();
  };

  // PDF Generation
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("GroceryTracker Report", 14, 15);
    doc.autoTable({
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: items.map(i => [i.name, `${i.qty} ${i.unit}`, `₹${i.price}`, `₹${i.total}`]),
      startY: 25,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });
    doc.save("grocery-report.pdf");
  };

  const addItem = (e) => {
    e.preventDefault();
    const newItem = { ...form, id: Date.now(), date: new Date().toISOString(), total: parseFloat(form.price) * parseFloat(form.qty) };
    setItems([newItem, ...items]);
    setIsModalOpen(false);
    setForm({ name: '', price: '', qty: '1', unit: 'kg' });
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 transition-colors">
        <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-emerald-600">GroceryTracker</h1>
          <div className="flex gap-2">
            <button onClick={handleVoice} className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-800'}`}><Mic size={20}/></button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full bg-slate-200 dark:bg-slate-800">{isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
            <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-emerald-600/20">Add</button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dashboard Stats */}
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Monthly</p>
                <h2 className="text-3xl font-bold text-emerald-600">₹{totalSpending}</h2>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Items</p>
                <h2 className="text-3xl font-bold">{items.length}</h2>
              </div>
            </div>
            
            {/* Chart Area */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-64">
              <div className="flex justify-between mb-4">
                <h3 className="font-bold tracking-tight">Spending Trends</h3>
                <button onClick={exportPDF} className="text-emerald-600 text-sm font-bold flex items-center gap-1"><Download size={14}/> PDF</button>
              </div>
              <Line data={{ labels: ['W1', 'W2', 'W3', 'W4'], datasets: [{ label: 'Spend', data: [400, 800, 600, totalSpending], borderColor: '#10b981', tension: 0.4 }]}} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Recent List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold">Purchase History</div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
              {items.map(item => (
                <div key={item.id} className="p-4 flex justify-between items-center hover:bg-emerald-50 dark:hover:bg-emerald-900/10">
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.qty} {item.unit} @ ₹{item.price}</p>
                  </div>
                  <p className="font-bold text-emerald-600">₹{item.total}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Add Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={addItem} className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold mb-6">New Grocery Entry</h2>
              <div className="space-y-4">
                <input required className="w-full p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none" placeholder="Item Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
                <div className="flex gap-2">
                  <input required type="number" className="w-1/2 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})}/>
                  <input required type="number" className="w-1/4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none" placeholder="Qty" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})}/>
                  <select className="w-1/4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                    <option>kg</option><option>g</option><option>pcs</option><option>L</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full mt-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-600/30">Save Purchase</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full mt-2 text-slate-500 text-sm">Cancel</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
