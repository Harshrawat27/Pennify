import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';

interface BillingDayPickerProps {
  /** Currently selected full date string YYYY-MM-DD, or null */
  selectedDate: string | null;
  onSelect: (date: string) => void;
  onClear: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Returns 0=Mon … 6=Sun for the 1st of a given month */
function firstDayOffset(year: number, month: number): number {
  const jsDay = new Date(year, month - 1, 1).getDay(); // 0=Sun…6=Sat
  return jsDay === 0 ? 6 : jsDay - 1; // convert to Mon-first
}

export function BillingDayPicker({ selectedDate, onSelect, onClear }: BillingDayPickerProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(
    selectedDate ? Number(selectedDate.slice(0, 4)) : now.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? Number(selectedDate.slice(5, 7)) : now.getMonth() + 1
  );

  const totalDays = daysInMonth(viewYear, viewMonth);
  const offset = firstDayOffset(viewYear, viewMonth);
  // Build grid: offset empty cells + day numbers + trailing empties to fill rows
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDay = selectedDate
    ? Number(selectedDate.slice(8, 10))
    : null;
  const selectedMonth = selectedDate ? Number(selectedDate.slice(5, 7)) : null;
  const selectedYear = selectedDate ? Number(selectedDate.slice(0, 4)) : null;

  function prevMonth() {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function handleDay(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (selectedDate === dateStr) {
      onClear();
    } else {
      onSelect(dateStr);
    }
  }

  const isSelected = (day: number) =>
    day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear;

  return (
    <View className='bg-white rounded-2xl p-4'>
      {/* Month / year navigation */}
      <View className='flex-row items-center justify-between mb-3'>
        <Pressable onPress={prevMonth} className='w-9 h-9 items-center justify-center rounded-full bg-neutral-100'>
          <Feather name='chevron-left' size={16} color='#000' />
        </Pressable>
        <Text className='text-[15px] font-bold text-black'>
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
        </Text>
        <Pressable onPress={nextMonth} className='w-9 h-9 items-center justify-center rounded-full bg-neutral-100'>
          <Feather name='chevron-right' size={16} color='#000' />
        </Pressable>
      </View>

      {/* Day-of-week headers */}
      <View className='flex-row mb-1'>
        {DAY_LABELS.map((d) => (
          <View key={d} className='flex-1 items-center py-1'>
            <Text className='text-[11px] font-semibold text-neutral-400'>{d}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      {Array.from({ length: cells.length / 7 }).map((_, row) => (
        <View key={row} className='flex-row'>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            const selected = day !== null && isSelected(day);
            return (
              <View key={col} className='flex-1 items-center py-0.5'>
                {day !== null ? (
                  <Pressable
                    onPress={() => handleDay(day)}
                    className={`w-9 h-9 rounded-full items-center justify-center ${selected ? 'bg-black' : ''}`}
                  >
                    <Text className={`text-[14px] font-medium ${selected ? 'text-white' : 'text-black'}`}>
                      {day}
                    </Text>
                  </Pressable>
                ) : (
                  <View className='w-9 h-9' />
                )}
              </View>
            );
          })}
        </View>
      ))}

      {/* Clear selection */}
      {selectedDate && (
        <Pressable onPress={onClear} className='mt-3 items-center py-2'>
          <Text className='text-[13px] text-neutral-400'>Clear date</Text>
        </Pressable>
      )}
    </View>
  );
}
