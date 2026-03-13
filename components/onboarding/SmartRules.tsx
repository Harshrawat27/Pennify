import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, LayoutAnimation, Modal, Platform, Pressable, ScrollView, Text, TextInput, UIManager, View } from 'react-native';
import { DEFAULT_EXPENSE_CATEGORIES, PARENT_CATEGORY_COLORS } from '@/lib/constants/categories';
import { useOnboardingStore } from '@/lib/stores/useOnboardingStore';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface SmartRulesProps {
  onNext: () => void;
  onBack: () => void;
}

// All default categories available as rule targets
const ALL_CATS = DEFAULT_EXPENSE_CATEGORIES;

export function SmartRules({ onNext, onBack }: SmartRulesProps) {
  const smartRules = useOnboardingStore((s) => s.smartRules);
  const setSmartRules = useOnboardingStore((s) => s.setSmartRules);

  const [showForm, setShowForm] = useState(false);
  const [modalView, setModalView] = useState<'form' | 'category'>('form');
  const [keyword, setKeyword] = useState('');
  const [selectedCat, setSelectedCat] = useState<(typeof ALL_CATS)[0] | null>(null);
  const [catSearch, setCatSearch] = useState('');

  const filteredCats = catSearch.trim()
    ? ALL_CATS.filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()))
    : ALL_CATS;

  const addRule = () => {
    if (!keyword.trim() || !selectedCat) return;
    const exists = smartRules.some(
      (r) => r.keyword.toLowerCase() === keyword.trim().toLowerCase()
    );
    if (exists) return;
    setSmartRules([
      ...smartRules,
      {
        keyword: keyword.trim(),
        categoryName: selectedCat.name,
        categoryIcon: selectedCat.icon,
        categoryColor: selectedCat.color,
      },
    ]);
    setKeyword('');
    setSelectedCat(null);
    setShowForm(false);
  };

  const removeRule = (kw: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSmartRules(smartRules.filter((r) => r.keyword !== kw));
  };

  const closeForm = () => {
    setShowForm(false);
    setModalView('form');
    setKeyword('');
    setSelectedCat(null);
    setCatSearch('');
  };

  return (
    <View className='flex-1'>
      <ScrollView
        className='flex-1'
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* Header */}
        <View className='px-6 pt-2 pb-4'>
          <Pressable
            onPress={onBack}
            className='w-10 h-10 rounded-full bg-white items-center justify-center mb-4'
          >
            <Feather name='arrow-left' size={20} color='#000' />
          </Pressable>
          <Text className='text-[28px] font-bold text-black'>Smart Rules</Text>
          <Text className='text-neutral-400 text-[15px] mt-2'>
            Tell us how you want things categorized — no AI needed.
          </Text>
        </View>

        {/* Explainer card */}
        <View className='mx-6 mb-5 bg-white rounded-2xl p-4'>
          <View className='flex-row items-center gap-2 mb-3'>
            <View className='w-7 h-7 rounded-lg bg-neutral-100 items-center justify-center'>
              <Feather name='zap' size={14} color='#000' />
            </View>
            <Text className='text-[14px] font-bold text-black'>How it works</Text>
          </View>
          <Text className='text-[13px] text-neutral-500 leading-5'>
            When you add a transaction with a title containing your keyword, it's instantly assigned
            to your chosen category — skipping AI entirely.
          </Text>
          {/* Example */}
          <View className='mt-3 bg-neutral-50 rounded-xl p-3 gap-2'>
            <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider'>
              Example
            </Text>
            <View className='flex-row items-center gap-2'>
              <View className='bg-orange-50 rounded-lg px-2.5 py-1'>
                <Text className='text-[12px] font-semibold text-orange-500'>paneer</Text>
              </View>
              <Feather name='arrow-right' size={12} color='#A3A3A3' />
              <View className='flex-row items-center gap-1.5'>
                <View
                  className='w-5 h-5 rounded-md items-center justify-center'
                  style={{ backgroundColor: `${PARENT_CATEGORY_COLORS['Food & Drink']}18` }}
                >
                  <Feather name='shopping-cart' size={10} color={PARENT_CATEGORY_COLORS['Food & Drink']} />
                </View>
                <Text className='text-[12px] font-medium text-black'>Groceries</Text>
              </View>
            </View>
            <View className='flex-row items-center gap-2'>
              <View className='bg-green-50 rounded-lg px-2.5 py-1'>
                <Text className='text-[12px] font-semibold text-green-600'>- diet</Text>
              </View>
              <Feather name='arrow-right' size={12} color='#A3A3A3' />
              <View className='flex-row items-center gap-1.5'>
                <View
                  className='w-5 h-5 rounded-md items-center justify-center'
                  style={{ backgroundColor: `${PARENT_CATEGORY_COLORS['Health & Wellness']}18` }}
                >
                  <Feather name='activity' size={10} color={PARENT_CATEGORY_COLORS['Health & Wellness']} />
                </View>
                <Text className='text-[12px] font-medium text-black'>Gym & Fitness</Text>
              </View>
            </View>
            <Text className='text-[11px] text-neutral-400 leading-4'>
              "paneer - diet" → matches <Text className='font-semibold'>- diet</Text> → Gym & Fitness ✓
            </Text>
          </View>
        </View>

        {/* Added rules */}
        {smartRules.length > 0 && (
          <View className='px-6 mb-4 gap-2'>
            {smartRules.map((rule) => (
              <View
                key={rule.keyword}
                className='bg-white rounded-2xl p-4 flex-row items-center gap-3'
              >
                <View
                  className='w-10 h-10 rounded-xl items-center justify-center'
                  style={{ backgroundColor: `${rule.categoryColor}18` }}
                >
                  <Feather name={rule.categoryIcon as any} size={16} color={rule.categoryColor} />
                </View>
                <View className='flex-1'>
                  <Text className='text-[14px] font-semibold text-black'>"{rule.keyword}"</Text>
                  <Text className='text-[12px] text-neutral-400 mt-0.5'>→ {rule.categoryName}</Text>
                </View>
                <Pressable
                  onPress={() => removeRule(rule.keyword)}
                  className='w-8 h-8 rounded-full bg-neutral-100 items-center justify-center'
                >
                  <Feather name='trash-2' size={14} color='#A3A3A3' />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Add button */}
        <View className='px-6'>
          <Pressable
            onPress={() => { setModalView('form'); setShowForm(true); }}
            className='flex-row items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-dashed border-neutral-300 self-start'
          >
            <Feather name='plus' size={14} color='#A3A3A3' />
            <Text className='text-[13px] font-medium text-neutral-400'>Add a rule</Text>
          </Pressable>
        </View>

        <View className='h-32' />
      </ScrollView>

      {/* Continue */}
      <View className='px-6 pb-10 pt-4 bg-neutral-50'>
        <Pressable
          onPress={onNext}
          className='py-4 rounded-2xl items-center bg-black'
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className='text-white font-bold text-[16px]'>
            {smartRules.length > 0 ? 'Continue' : 'Skip for now'}
          </Text>
        </Pressable>
      </View>

      {/* Add Rule Modal */}
      <Modal
        visible={showForm}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={30}
        >
          <View className='flex-1 bg-neutral-50'>
            {modalView === 'form' ? (
              <>
                {/* Handle + header */}
                <View className='items-center pt-3 pb-1'>
                  <View className='w-10 h-1 rounded-full bg-neutral-300' />
                </View>
                <View className='flex-row items-center justify-between px-6 py-4'>
                  <Text className='text-[20px] font-bold text-black'>Add a Rule</Text>
                  <Pressable onPress={closeForm} className='w-9 h-9 rounded-full bg-white items-center justify-center'>
                    <Feather name='x' size={18} color='#000' />
                  </Pressable>
                </View>

                <View className='flex-1 px-6'>
                  {/* Keyword input */}
                  <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3'>
                    Keyword
                  </Text>
                  <View className='bg-white rounded-xl px-4 py-3 mb-5'>
                    <TextInput
                      value={keyword}
                      onChangeText={setKeyword}
                      placeholder='e.g. netflix, - diet, rent'
                      placeholderTextColor='#D4D4D4'
                      className='text-[16px] text-black'
                      autoFocus
                      autoCapitalize='none'
                    />
                  </View>

                  {/* Category selector */}
                  <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3'>
                    Category
                  </Text>
                  <Pressable
                    onPress={() => setModalView('category')}
                    className='flex-row items-center bg-white rounded-xl px-4 py-3.5 mb-6'
                  >
                    {selectedCat ? (
                      <>
                        <View
                          className='w-7 h-7 rounded-lg items-center justify-center mr-3'
                          style={{ backgroundColor: `${selectedCat.color}18` }}
                        >
                          <Feather name={selectedCat.icon as any} size={13} color={selectedCat.color} />
                        </View>
                        <Text className='flex-1 text-[15px] font-medium text-black'>{selectedCat.name}</Text>
                      </>
                    ) : (
                      <Text className='flex-1 text-[15px] text-neutral-300'>Select category</Text>
                    )}
                    <Feather name='chevron-right' size={15} color='#D4D4D4' />
                  </Pressable>
                </View>

                {/* Actions */}
                <View className='px-6 pb-10 pt-3 flex-row gap-3'>
                  <Pressable
                    onPress={closeForm}
                    className='flex-1 py-3.5 rounded-2xl items-center bg-neutral-200'
                  >
                    <Text className='text-neutral-600 font-semibold text-[15px]'>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={addRule}
                    disabled={!keyword.trim() || !selectedCat}
                    className='flex-1 py-3.5 rounded-2xl items-center bg-black'
                    style={{ opacity: !keyword.trim() || !selectedCat ? 0.35 : 1 }}
                  >
                    <Text className='text-white font-bold text-[15px]'>Add Rule</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                {/* Category picker header */}
                <View className='items-center pt-3 pb-1'>
                  <View className='w-10 h-1 rounded-full bg-neutral-300' />
                </View>
                <View className='flex-row items-center px-6 py-4 gap-3'>
                  <Pressable
                    onPress={() => { setModalView('form'); setCatSearch(''); }}
                    className='w-9 h-9 rounded-full bg-white items-center justify-center'
                  >
                    <Feather name='arrow-left' size={18} color='#000' />
                  </Pressable>
                  <Text className='flex-1 text-[20px] font-bold text-black'>Pick a Category</Text>
                </View>

                {/* Search */}
                <View className='mx-6 mb-3 bg-white rounded-2xl flex-row items-center px-4 gap-3'>
                  <Feather name='search' size={15} color='#A3A3A3' />
                  <TextInput
                    value={catSearch}
                    onChangeText={setCatSearch}
                    placeholder='Search…'
                    placeholderTextColor='#D4D4D4'
                    className='flex-1 py-3 text-[14px] text-black'
                    autoCapitalize='none'
                  />
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
                  {filteredCats.map((cat) => {
                    const isSelected = selectedCat?.name === cat.name;
                    return (
                      <Pressable
                        key={cat.name}
                        onPress={() => {
                          setSelectedCat(cat);
                          setModalView('form');
                          setCatSearch('');
                        }}
                        className='bg-white rounded-2xl p-4 mb-2 flex-row items-center gap-3'
                      >
                        <View
                          className='w-10 h-10 rounded-xl items-center justify-center'
                          style={{ backgroundColor: `${cat.color}18` }}
                        >
                          <Feather name={cat.icon as any} size={16} color={cat.color} />
                        </View>
                        <View className='flex-1'>
                          <Text className='text-[14px] font-medium text-black'>{cat.name}</Text>
                          <Text className='text-[11px] text-neutral-400'>{cat.parentCategory}</Text>
                        </View>
                        {isSelected && <Feather name='check' size={16} color='#000' />}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
