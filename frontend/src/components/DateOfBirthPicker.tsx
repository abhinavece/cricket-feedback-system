import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DateOfBirthPickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  required?: boolean;
}

const DateOfBirthPicker: React.FC<DateOfBirthPickerProps> = ({
  value,
  onChange,
  label = 'Date of Birth',
  required = false
}) => {
  const [day, setDay] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setDay(String(date.getDate()).padStart(2, '0'));
      setMonth(String(date.getMonth() + 1).padStart(2, '0'));
      setYear(String(date.getFullYear()));
    }
  }, [value]);

  const handleDateChange = (newDay: string, newMonth: string, newYear: string) => {
    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);

    if (newDay && newMonth && newYear) {
      const dateString = `${newYear}-${newMonth}-${newDay}`;
      onChange(dateString);
    }
  };

  const currentYear = new Date().getFullYear();
  const minYear = 1950;
  const maxYear = currentYear - 13;

  const days = Array.from({ length: 31 }, (_, i) => 
    String(i + 1).padStart(2, '0')
  );

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => 
    maxYear - i
  );

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      
      <div className="grid grid-cols-3 gap-3">
        {/* Day Selector */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Day</label>
          <div className="relative">
            <select
              value={day}
              onChange={(e) => handleDateChange(e.target.value, month, year)}
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-sm"
            >
              <option value="">Day</option>
              {days.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Month Selector */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Month</label>
          <div className="relative">
            <select
              value={month}
              onChange={(e) => handleDateChange(day, e.target.value, year)}
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-sm"
            >
              <option value="">Month</option>
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Year Selector */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Year</label>
          <div className="relative">
            <select
              value={year}
              onChange={(e) => handleDateChange(day, month, e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-sm"
            >
              <option value="">Year</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {day && month && year && (
        <p className="text-xs text-emerald-400 mt-2">
          Selected: {months.find(m => m.value === month)?.label} {day}, {year}
        </p>
      )}
    </div>
  );
};

export default DateOfBirthPicker;
