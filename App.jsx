import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, ShoppingCart, Download, TrendingUp, 
  Sun, Moon, Mic, Lock, ArrowUpRight, ArrowDownRight, X, CheckCircle2, Share2
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, 
  PointElement, LineElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function GroceryTracker() {
  const [items, setItems] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'shopping'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', qty: '1', unit: 'kg', status: 'bought' });

  // 1. Persistence
  useEffect(() => {
    const saved = localStorage.getItem('groceryData');
    if (saved) setItems(JSON.parse(saved));
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) setIsDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('groceryData', JSON.stringify(items));
  }, [items]);

  // 2. Data Filtering & Summaries
  const shoppingList = items.filter(i => i.status === 'planned');
  const purchaseHistory = items.filter(i => i.status === 'bought');
  const totalSpending = purchaseHistory.reduce((acc, curr) => acc + curr.total, 0);
  
  // Savings Logic (Mocking last month as 15% higher)
  const lastMonthSpend = totalSpending > 0 ? totalSpending * 1.15 : 5000;
  const savings = lastMonthSpend - totalSpending;
  const isSaving = savings > 0;

  // 3. Actions
  const markAsBought = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, status: 'bought', date: new Date().toISOString() } : item
    ));
  };

  const shareToWhatsApp = () => {
    const list = shoppingList.map((i, idx) => `${idx + 1}. ${i.name} (${i.qty} ${i.unit})`).join("\n");
    const msg = encodeURIComponent(`*🛒 My Shopping List*\n\n${list}\n\n_Sent via GroceryTracker_`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice not supported");
    const rec = new SpeechRecognition();
    rec.onstart = () => setIsListening(true);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript.toLowerCase();
      const priceMatch = text.match(/\d+/);
      const price = priceMatch ? priceMatch[0] : "0";
      const name = text.replace(price, "").replace("rupees", "").replace("to list", "").trim();
      setForm({ ...form, name, price, status: text.includes("list") ? "planned" : "bought" });
      setIsModalOpen(true);
    };
    rec.onend = () => setIsListening(false);
    rec.start();
  };

  const addItem = (e) => {
    e.preventDefault();
    const newItem = { 
      ...form, id: Date.now(), date: new Date().toISOString(), 
      price: parseFloat(form.price || 0), 
      total: parseFloat(form.price || 0) * parseFloat(form.qty) 
    };
    setItems([newItem, ...items]);
    setIsModalOpen(false);
    setForm({ name: '', price: '', qty: '1', unit: 'kg', status: 'bought' });
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors p-4 md:p-8 pb-24">
        
        {/* Header */}
        <header className="max-w-5xl mx-auto flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-emerald-600">GroceryTracker</h1>
          <div className="flex gap-2">
            <button onClick={startVoice} className={`p-3 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm'}`}><Mic size={20} /></button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Savings Summary */}
            <div className={`p-6 rounded-3xl border ${isSaving ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10' : 'bg-amber-50 border-amber-100 dark:bg-amber-900/10'} flex justify-between items-center`}>
              <div>
                <h3 className="font-bold">{isSaving ? "Savings This Month" : "Budget Alert"}</h3>
                <p className="text-3xl font-black text-emerald-600">₹{Math.abs(savings).toFixed(0)}</p>
              </div>
              <div className={`px-4 py-2 rounded-xl font-bold ${isSaving ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                {isSaving ? 'Good Job!' : 'Spending Up'}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Spend</p>
                <h2 className="text-3xl font-black">₹{totalSpending}</h2>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase">Items Bought</p>
                <h2 className="text-3xl font-black">{purchaseHistory.length}</h2>
              </div>
            </div>
          </div>

          {/* Tabbed List Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[600px] overflow-hidden">
            <div className="flex border-b border-slate-100 dark:border-slate-800">
              <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 font-bold ${activeTab === 'history' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}>History</button>
              <button onClick={() => setActiveTab('shopping')} className={`flex-1 py-4 font-bold ${activeTab === 'shopping' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}>List ({shoppingList.length})</button>
            </div>

            {activeTab === 'shopping' && shoppingList.length > 0 && (
              <button onClick={shareToWhatsApp} className="m-4 flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-2xl font-bold"><Share2 size={18}/> Share to WhatsApp</button>
            )}

            <div className="overflow-y-auto flex-1 divide-y divide-slate-50 dark:divide-slate-800">
              {(activeTab === 'history' ? purchaseHistory : shoppingList).map(item => (
                <div key={item.id} className="p-5 flex justify-between items-center group">
                  <div>
                    <p className="font-bold capitalize">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.qty} {item.unit} @ ₹{item.price}</p>
                  </div>
                  {activeTab === 'shopping' ? (
                    <button onClick={() => markAsBought(item.id)} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-full"><CheckCircle2/></button>
                  ) : (
                    <p className="font-black text-emerald-600">₹{item.total}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Floating Add Button */}
        <button onClick={() => setIsModalOpen(true)} className="fixed bottom-8 right-8 bg-emerald-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"><Plus size={32}/></button>

        {/* Modal Logic ... (Keep from previous version) */}
        {isModalOpen && (
           <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
             <form onSubmit={addItem} className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2rem]">
                <h2 className="text-2xl font-black mb-6">New Entry</h2>
                <div className="space-y-4">
                  <input required className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none outline-none" placeholder="Item Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
                  <div className="flex gap-2">
                    <input required type="number" className="w-1/2 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})}/>
                    <select className="w-1/2 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      <option value="bought">Bought</option>
                      <option value="planned">Add to List</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full mt-8 py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg">Save</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full mt-2 text-slate-400">Cancel</button>
             </form>
           </div>
        )}
      </div>
    </div>
  );
}
