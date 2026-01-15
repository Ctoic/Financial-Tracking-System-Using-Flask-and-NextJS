import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5051';

const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const baseMealTypes = ['Breakfast', 'Lunch', 'Dinner'];
const defaultTimingByMeal: Record<string, { start: string; end: string }> = {
  Breakfast: { start: '07:30', end: '09:00' },
  Lunch: { start: '13:00', end: '14:30' },
  Dinner: { start: '19:30', end: '21:00' },
};

interface MealTiming {
  meal_name: string;
  start_time: string;
  end_time: string;
  notes?: string | null;
}

interface MealMenuItem {
  day_of_week: number;
  meal_name: string;
  menu_items?: string | null;
}

type MenuByDay = Record<number, Record<string, string>>;

const buildEmptyDayMenu = (mealTypes: string[]) =>
  mealTypes.reduce<Record<string, string>>((acc, meal) => {
    acc[meal] = '';
    return acc;
  }, {});

const buildEmptyMenu = (mealTypes: string[]) =>
  dayLabels.reduce<MenuByDay>((acc, _day, idx) => {
    acc[idx] = buildEmptyDayMenu(mealTypes);
    return acc;
  }, {});

const buildDefaultTimings = (mealTypes: string[]) =>
  mealTypes.map<MealTiming>((meal) => ({
    meal_name: meal,
    start_time: defaultTimingByMeal[meal]?.start ?? '',
    end_time: defaultTimingByMeal[meal]?.end ?? '',
    notes: '',
  }));

export default function Meals() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTimings, setIsSavingTimings] = useState(false);
  const [isSavingMenu, setIsSavingMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [mealTypes, setMealTypes] = useState<string[]>(baseMealTypes);
  const [timings, setTimings] = useState<MealTiming[]>(buildDefaultTimings(baseMealTypes));
  const [menuByDay, setMenuByDay] = useState<MenuByDay>(buildEmptyMenu(baseMealTypes));

  const activeMenu = menuByDay[activeDay] ?? buildEmptyDayMenu(mealTypes);

  const daySummary = useMemo(() => {
    const totalMeals = mealTypes.length;
    const filled = mealTypes.filter((meal) => activeMenu?.[meal]?.trim()).length;
    return { totalMeals, filled };
  }, [activeMenu, mealTypes]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMeals();
    }
  }, [isAuthenticated]);

  const hydrateState = (data: { timings?: MealTiming[]; menu?: MealMenuItem[] }) => {
    const timingList = Array.isArray(data.timings) ? data.timings : [];
    const menuList = Array.isArray(data.menu) ? data.menu : [];

    const mealSet = new Set(baseMealTypes);
    timingList.forEach((item) => {
      const name = String(item?.meal_name || '').trim();
      if (name) mealSet.add(name);
    });
    menuList.forEach((item) => {
      const name = String(item?.meal_name || '').trim();
      if (name) mealSet.add(name);
    });

    const mergedMealTypes = Array.from(mealSet);
    setMealTypes(mergedMealTypes);

    const timingMap = new Map<string, MealTiming>();
    timingList.forEach((item) => {
      const name = String(item?.meal_name || '').trim();
      if (name) {
        timingMap.set(name, {
          meal_name: name,
          start_time: item?.start_time ?? '',
          end_time: item?.end_time ?? '',
          notes: item?.notes ?? '',
        });
      }
    });

    const nextTimings = mergedMealTypes.map((meal) => {
      const existing = timingMap.get(meal);
      if (existing) {
        return {
          ...existing,
          start_time: existing.start_time ?? '',
          end_time: existing.end_time ?? '',
          notes: existing.notes ?? '',
        };
      }
      return {
        meal_name: meal,
        start_time: defaultTimingByMeal[meal]?.start ?? '',
        end_time: defaultTimingByMeal[meal]?.end ?? '',
        notes: '',
      };
    });
    setTimings(nextTimings);

    const nextMenu = buildEmptyMenu(mergedMealTypes);
    menuList.forEach((item) => {
      const day = Number(item?.day_of_week);
      const meal = String(item?.meal_name || '').trim();
      if (!Number.isFinite(day) || day < 0 || day > 6 || !meal) return;
      if (!nextMenu[day]) {
        nextMenu[day] = buildEmptyDayMenu(mergedMealTypes);
      }
      nextMenu[day][meal] = String(item?.menu_items ?? '');
    });
    setMenuByDay(nextMenu);
  };

  const fetchMeals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/meals`, {
        withCredentials: true,
        headers: {
          Accept: 'application/json',
        },
      });
      hydrateState(data || {});
    } catch (err: any) {
      console.error('Error fetching meal settings:', err);
      setError(err.response?.data?.message || 'Failed to fetch meal settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimingChange = (index: number, field: keyof MealTiming, value: string) => {
    setTimings((prev) =>
      prev.map((timing, idx) => (idx === index ? { ...timing, [field]: value } : timing))
    );
  };

  const handleMenuChange = (meal: string, value: string) => {
    setMenuByDay((prev) => ({
      ...prev,
      [activeDay]: {
        ...(prev[activeDay] ?? buildEmptyDayMenu(mealTypes)),
        [meal]: value,
      },
    }));
  };

  const handleCopyPrevious = () => {
    if (activeDay === 0) return;
    setMenuByDay((prev) => ({
      ...prev,
      [activeDay]: {
        ...(prev[activeDay - 1] ?? buildEmptyDayMenu(mealTypes)),
      },
    }));
  };

  const handleApplyToAll = () => {
    setMenuByDay((prev) => {
      const source = prev[activeDay] ?? buildEmptyDayMenu(mealTypes);
      const next: MenuByDay = {};
      dayLabels.forEach((_day, idx) => {
        next[idx] = { ...source };
      });
      return next;
    });
  };

  const handleClearDay = () => {
    setMenuByDay((prev) => ({
      ...prev,
      [activeDay]: buildEmptyDayMenu(mealTypes),
    }));
  };

  const handleSaveTimings = async () => {
    setIsSavingTimings(true);
    try {
      const { data } = await axios.put(
        `${API_BASE_URL}/api/meals/timings`,
        { timings },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
      if (data?.success) {
        toast.success('Meal timings saved');
        const menuPayload: MealMenuItem[] = dayLabels.flatMap((_day, dayIndex) =>
          mealTypes.map((meal) => ({
            day_of_week: dayIndex,
            meal_name: meal,
            menu_items: menuByDay?.[dayIndex]?.[meal] ?? '',
          }))
        );
        hydrateState({ timings: Array.isArray(data.timings) ? data.timings : timings, menu: menuPayload });
      } else {
        toast.error(data?.message || 'Failed to save timings');
      }
    } catch (err: any) {
      console.error('Error saving timings:', err);
      toast.error(err.response?.data?.message || 'Failed to save timings');
    } finally {
      setIsSavingTimings(false);
    }
  };

  const handleSaveMenu = async () => {
    setIsSavingMenu(true);
    try {
      const menuPayload: MealMenuItem[] = dayLabels.flatMap((_day, dayIndex) =>
        mealTypes.map((meal) => ({
          day_of_week: dayIndex,
          meal_name: meal,
          menu_items: menuByDay?.[dayIndex]?.[meal] ?? '',
        }))
      );

      const { data } = await axios.put(
        `${API_BASE_URL}/api/meals/menu`,
        { menu: menuPayload },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
      if (data?.success) {
        toast.success('Menu saved');
        hydrateState({ timings, menu: Array.isArray(data.menu) ? data.menu : menuPayload });
      } else {
        toast.error(data?.message || 'Failed to save menu');
      }
    } catch (err: any) {
      console.error('Error saving menu:', err);
      toast.error(err.response?.data?.message || 'Failed to save menu');
    } finally {
      setIsSavingMenu(false);
    }
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-red-600 text-lg">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Menu & Food Timings</h1>
            <p className="text-sm text-gray-500">
              Update the weekly menu and keep meal hours consistent for residents.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSaveTimings}
              disabled={isSavingTimings}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60"
            >
              {isSavingTimings ? 'Saving Timings...' : 'Save Timings'}
            </button>
            <button
              onClick={handleSaveMenu}
              disabled={isSavingMenu}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60"
            >
              {isSavingMenu ? 'Saving Menu...' : 'Save Menu'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Meal Timings</h2>
              <p className="text-sm text-gray-500">Set the time window for each meal.</p>
            </div>

            <div className="space-y-4">
              {timings.map((timing, idx) => (
                <div key={timing.meal_name} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">{timing.meal_name}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Start time</label>
                      <input
                        type="time"
                        value={timing.start_time || ''}
                        onChange={(e) => handleTimingChange(idx, 'start_time', e.target.value)}
                        className="w-full border border-gray-200 rounded-md bg-white px-3 py-2 text-sm text-gray-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">End time</label>
                      <input
                        type="time"
                        value={timing.end_time || ''}
                        onChange={(e) => handleTimingChange(idx, 'end_time', e.target.value)}
                        className="w-full border border-gray-200 rounded-md bg-white px-3 py-2 text-sm text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Notes</label>
                    <input
                      type="text"
                      value={timing.notes ?? ''}
                      onChange={(e) => handleTimingChange(idx, 'notes', e.target.value)}
                      placeholder="Optional notes (e.g., fruit bar on Fridays)"
                      className="w-full border border-gray-200 rounded-md bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="xl:col-span-2 bg-white rounded-lg shadow p-6 space-y-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Weekly Menu</h2>
                <p className="text-sm text-gray-500">
                  Fill in meal items for each day. Use commas or new lines.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCopyPrevious}
                  disabled={activeDay === 0}
                  className="border border-gray-200 px-3 py-2 rounded-md text-sm text-gray-700 disabled:opacity-50"
                >
                  Copy Previous Day
                </button>
                <button
                  onClick={handleApplyToAll}
                  className="border border-gray-200 px-3 py-2 rounded-md text-sm text-gray-700"
                >
                  Apply to All Days
                </button>
                <button
                  onClick={handleClearDay}
                  className="border border-gray-200 px-3 py-2 rounded-md text-sm text-gray-700"
                >
                  Clear Day
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {dayLabels.map((day, idx) => (
                <button
                  key={day}
                  onClick={() => setActiveDay(idx)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    idx === activeDay
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{dayLabels[activeDay]}</span>
              <span>
                {daySummary.filled} of {daySummary.totalMeals} meals filled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mealTypes.map((meal) => (
                <div key={meal} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">{meal}</h3>
                    <span className="text-xs text-gray-500">Menu items</span>
                  </div>
                  <textarea
                    value={activeMenu?.[meal] ?? ''}
                    onChange={(e) => handleMenuChange(meal, e.target.value)}
                    rows={4}
                    placeholder="e.g., Chana, Paratha, Yogurt"
                    className="w-full border border-gray-200 rounded-md bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
