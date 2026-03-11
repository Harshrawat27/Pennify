import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { useCachedCategories } from '@/lib/hooks/useCachedCategories';
import { getCachedRules, setCachedRules, type CachedRule } from '@/lib/localCache';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function SmartRulesScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const categories = useCachedCategories();
  const convexRules = useQuery(api.rules.list, userId ? { userId } : 'skip');
  const createRule = useMutation(api.rules.create);
  const removeRule = useMutation(api.rules.remove);

  const [rules, setRules] = useState<CachedRule[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addView, setAddView] = useState<'form' | 'category'>('form');
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[0] | null>(null);
  const [saving, setSaving] = useState(false);
  const [catSearch, setCatSearch] = useState('');

  // Seed from cache on mount
  useEffect(() => {
    getCachedRules().then((cached) => {
      if (cached.length > 0) setRules(cached);
    });
  }, []);

  // Sync from Convex + write through to cache
  useEffect(() => {
    if (convexRules === undefined) return;
    const mapped: CachedRule[] = (convexRules as any[]).map((r) => ({
      _id: r._id,
      keyword: r.keyword,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      categoryColor: r.categoryColor,
      createdAt: r.createdAt,
    }));
    void setCachedRules(mapped);
    setRules(mapped);
  }, [convexRules]);

  const handleAdd = async () => {
    if (!keyword.trim() || !selectedCategory || !userId) return;
    setSaving(true);
    try {
      await createRule({
        userId,
        keyword: keyword.trim(),
        categoryId: selectedCategory._id as any,
        categoryName: selectedCategory.name,
        categoryIcon: selectedCategory.icon,
        categoryColor: (selectedCategory as any).color ?? '#A3A3A3',
      });
      // Cache is updated via convexRules useEffect (Convex will push update)
      setKeyword('');
      setSelectedCategory(null);
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule: CachedRule) => {
    if (!userId) return;
    // Optimistic remove from local state + cache immediately
    const updated = rules.filter((r) => r._id !== rule._id);
    setRules(updated);
    void setCachedRules(updated);
    void removeRule({ id: rule._id as any });
  };

  const filteredCats = catSearch.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()))
    : categories;

  return (
    <View className='flex-1 bg-neutral-50'>
      {/* Header */}
      <View className='px-4 pt-4 pb-3 flex-row items-center gap-3'>
        <Pressable
          onPress={() => router.back()}
          className='w-10 h-10 rounded-full bg-white items-center justify-center'
        >
          <Feather name='arrow-left' size={20} color='#000' />
        </Pressable>
        <Text className='flex-1 text-[18px] font-bold text-black'>Smart Rules</Text>
        <Pressable
          onPress={() => setShowAdd(true)}
          className='w-10 h-10 rounded-full bg-black items-center justify-center'
        >
          <Feather name='plus' size={20} color='#fff' />
        </Pressable>
      </View>

      {/* Description */}
      <View className='mx-4 mb-4 bg-white rounded-2xl px-4 py-3 flex-row items-start gap-3'>
        <Feather name='zap' size={16} color='#A3A3A3' style={{ marginTop: 1 }} />
        <Text className='flex-1 text-[13px] text-neutral-400 leading-5'>
          When a transaction title matches a keyword, it's instantly assigned to that category — no AI needed.
          Exact matches take priority, then contains matches (oldest rule wins).
        </Text>
      </View>

      {/* Rules list */}
      {convexRules === undefined ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#000' />
        </View>
      ) : rules.length === 0 ? (
        <View className='flex-1 items-center justify-center px-8'>
          <View className='w-16 h-16 rounded-2xl bg-white items-center justify-center mb-4'>
            <Feather name='zap' size={28} color='#D4D4D4' />
          </View>
          <Text className='text-[16px] font-bold text-black mb-2'>No rules yet</Text>
          <Text className='text-[13px] text-neutral-400 text-center leading-5'>
            Add a rule to auto-categorize transactions without using AI.
          </Text>
          <Pressable
            onPress={() => setShowAdd(true)}
            className='mt-6 bg-black rounded-2xl px-6 py-3'
          >
            <Text className='text-white font-semibold text-[14px]'>Add First Rule</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(r) => r._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View className='bg-white rounded-2xl p-4 mb-3 flex-row items-center gap-3'>
              <View
                className='w-10 h-10 rounded-xl items-center justify-center'
                style={{ backgroundColor: `${item.categoryColor}18` }}
              >
                <Feather name={item.categoryIcon as any} size={16} color={item.categoryColor} />
              </View>
              <View className='flex-1'>
                <Text className='text-[14px] font-semibold text-black'>"{item.keyword}"</Text>
                <Text className='text-[12px] text-neutral-400 mt-0.5'>→ {item.categoryName}</Text>
              </View>
              <Pressable
                onPress={() => handleDelete(item)}
                className='w-8 h-8 rounded-full bg-neutral-100 items-center justify-center'
              >
                <Feather name='trash-2' size={14} color='#A3A3A3' />
              </Pressable>
            </View>
          )}
        />
      )}

      {/* Single modal — switches between 'form' and 'category' views internally */}
      <Modal
        visible={showAdd}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => {
          if (addView === 'category') { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setAddView('form'); setCatSearch(''); }
          else { setShowAdd(false); setKeyword(''); setSelectedCategory(null); }
        }}
      >
        <View className='flex-1 bg-neutral-50'>
          <View className='items-center pt-3 pb-1'>
            <View className='w-10 h-1 rounded-full bg-neutral-200' />
          </View>

          {addView === 'form' ? (
            <>
              <View className='px-6 pt-4 pb-4 flex-row justify-between items-center'>
                <Text className='text-[18px] font-bold text-black'>New Rule</Text>
                <Pressable
                  onPress={() => { setShowAdd(false); setKeyword(''); setSelectedCategory(null); }}
                  className='w-9 h-9 rounded-full bg-neutral-100 items-center justify-center'
                >
                  <Feather name='x' size={18} color='#000' />
                </Pressable>
              </View>

              <View className='px-6 gap-4'>
                <View>
                  <Text className='text-[12px] text-neutral-400 font-semibold uppercase tracking-wider mb-2'>
                    Keyword
                  </Text>
                  <TextInput
                    value={keyword}
                    onChangeText={setKeyword}
                    placeholder='e.g. - diet, netflix, uber'
                    placeholderTextColor='#D4D4D4'
                    className='bg-white rounded-2xl px-4 py-4 text-[15px] text-black'
                    autoFocus
                    autoCapitalize='none'
                  />
                </View>

                <View>
                  <Text className='text-[12px] text-neutral-400 font-semibold uppercase tracking-wider mb-2'>
                    Category
                  </Text>
                  <Pressable
                    onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setAddView('category'); }}
                    className='bg-white rounded-2xl px-4 py-4 flex-row items-center'
                  >
                    {selectedCategory ? (
                      <>
                        <View
                          className='w-8 h-8 rounded-xl items-center justify-center mr-3'
                          style={{ backgroundColor: `${(selectedCategory as any).color ?? '#A3A3A3'}18` }}
                        >
                          <Feather
                            name={selectedCategory.icon as any}
                            size={14}
                            color={(selectedCategory as any).color ?? '#A3A3A3'}
                          />
                        </View>
                        <Text className='flex-1 text-[15px] font-medium text-black'>{selectedCategory.name}</Text>
                      </>
                    ) : (
                      <Text className='flex-1 text-[15px] text-neutral-300'>Select a category</Text>
                    )}
                    <Feather name='chevron-right' size={16} color='#D4D4D4' />
                  </Pressable>
                </View>

                <Pressable
                  onPress={handleAdd}
                  disabled={!keyword.trim() || !selectedCategory || saving}
                  className='bg-black rounded-2xl py-4 items-center mt-2'
                  style={{ opacity: !keyword.trim() || !selectedCategory ? 0.4 : 1 }}
                >
                  {saving ? (
                    <ActivityIndicator size='small' color='#fff' />
                  ) : (
                    <Text className='text-white font-bold text-[15px]'>Save Rule</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View className='px-6 pt-4 pb-3 flex-row items-center gap-3 border-b border-neutral-100'>
                <Pressable
                  onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setAddView('form'); setCatSearch(''); }}
                  className='w-9 h-9 rounded-full bg-neutral-100 items-center justify-center'
                >
                  <Feather name='arrow-left' size={18} color='#000' />
                </Pressable>
                <Text className='flex-1 text-[18px] font-bold text-black'>Select Category</Text>
              </View>
              <View className='mx-4 mt-3 mb-2 bg-white rounded-2xl flex-row items-center px-4 gap-3'>
                <Feather name='search' size={15} color='#A3A3A3' />
                <TextInput
                  value={catSearch}
                  onChangeText={setCatSearch}
                  placeholder='Search categories…'
                  placeholderTextColor='#D4D4D4'
                  className='flex-1 py-3 text-[14px] text-black'
                  autoCapitalize='none'
                />
              </View>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
                {filteredCats.filter((c) => c.type === 'expense').map((cat) => {
                  const color = (cat as any).color ?? '#A3A3A3';
                  const isSelected = selectedCategory?._id === cat._id;
                  return (
                    <Pressable
                      key={cat._id}
                      onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setSelectedCategory(cat); setAddView('form'); setCatSearch(''); }}
                      className='bg-white rounded-2xl p-4 mb-2 flex-row items-center gap-3'
                    >
                      <View
                        className='w-10 h-10 rounded-xl items-center justify-center'
                        style={{ backgroundColor: `${color}18` }}
                      >
                        <Feather name={cat.icon as any} size={16} color={color} />
                      </View>
                      <Text className='flex-1 text-[14px] font-medium text-black'>{cat.name}</Text>
                      {isSelected && <Feather name='check' size={16} color='#000' />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}
