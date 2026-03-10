import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  PARENT_CATEGORIES,
  PARENT_CATEGORY_COLORS,
} from '@/lib/constants/categories';
import type { FeatherIcon } from '@/lib/models/types';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function CategoriesScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const categories = useQuery(
    api.categories.list,
    userId ? { userId } : 'skip'
  );
  const createCategory = useMutation(api.categories.create);
  const removeCategory = useMutation(api.categories.remove);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [parentCategory, setParentCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const customCategories = categories?.filter((c) => !c.isDefault) ?? [];

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!userId || !trimmed || isSaving) return;
    setIsSaving(true);
    try {
      const color = parentCategory
        ? PARENT_CATEGORY_COLORS[parentCategory]
        : '#6B7280';
      await createCategory({
        userId,
        name: trimmed,
        icon: 'tag',
        type: 'expense',
        color,
        parentCategory: parentCategory ?? undefined,
      });
      setNewName('');
      setParentCategory(null);
      setShowAdd(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Category',
      `Delete "${name}"? This won't affect existing transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void removeCategory({ id: id as any }),
        },
      ]
    );
  };

  return (
    <>
      <View className='flex-1 bg-neutral-50'>
        {/* Header */}
        <View className='px-6 pt-4 pb-4 flex-row items-center justify-between'>
          <View className='flex-row items-center gap-4'>
            <Pressable
              onPress={() => router.back()}
              className='w-10 h-10 rounded-full bg-white items-center justify-center'
            >
              <Feather name='arrow-left' size={20} color='#000' />
            </Pressable>
            <Text className='text-[20px] font-bold text-black'>Categories</Text>
          </View>
          <Pressable
            onPress={() => setShowAdd(true)}
            className='w-10 h-10 rounded-full bg-white items-center justify-center'
          >
            <Feather name='plus' size={20} color='#000' />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Custom categories */}
          <View className='mx-6 mb-5'>
            <Text className='text-[12px] text-neutral-400 font-semibold uppercase tracking-wider mb-2 ml-1'>
              Your Categories
            </Text>
            <View className='bg-white rounded-2xl px-4'>
              {customCategories.length === 0 ? (
                <View className='py-6 items-center'>
                  <Feather name='tag' size={22} color='#D4D4D4' />
                  <Text className='text-neutral-400 text-[13px] mt-2 text-center'>
                    No custom categories yet.{'\n'}Tap + to add one.
                  </Text>
                </View>
              ) : (
                customCategories.map((cat, i) => (
                  <View
                    key={cat._id}
                    className={`flex-row items-center py-3.5 ${
                      i < customCategories.length - 1
                        ? 'border-b border-neutral-100'
                        : ''
                    }`}
                  >
                    <View className='w-8 h-8 rounded-lg bg-neutral-100 items-center justify-center'>
                      <Feather
                        name={cat.icon as FeatherIcon}
                        size={14}
                        color='#6B7280'
                      />
                    </View>
                    <Text className='flex-1 text-[14px] font-medium text-black ml-3'>
                      {cat.name}
                    </Text>
                    <Pressable
                      onPress={() => handleDelete(cat._id, cat.name)}
                      className='w-8 h-8 items-center justify-center'
                    >
                      <Feather name='trash-2' size={15} color='#EF4444' />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Default categories grouped by parent */}
          <View className='mx-6 mb-2'>
            <Text className='text-[12px] text-neutral-400 font-semibold uppercase tracking-wider mb-2 ml-1'>
              Default Categories
            </Text>
          </View>

          {PARENT_CATEGORIES.map((parent) => {
            const cats = DEFAULT_EXPENSE_CATEGORIES.filter(
              (c) => c.parentCategory === parent
            );
            const color = PARENT_CATEGORY_COLORS[parent];
            return (
              <View key={parent} className='mx-6 mb-4'>
                <View className='flex-row items-center gap-2 mb-2 ml-1'>
                  <View
                    className='w-2 h-2 rounded-full'
                    style={{ backgroundColor: color }}
                  />
                  <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider'>
                    {parent}
                  </Text>
                </View>
                <View className='bg-white rounded-2xl px-4'>
                  {cats.map((cat, i) => (
                    <View
                      key={cat.name}
                      className={`flex-row items-center py-3 ${
                        i < cats.length - 1 ? 'border-b border-neutral-100' : ''
                      }`}
                    >
                      <View
                        className='w-8 h-8 rounded-lg items-center justify-center'
                        style={{ backgroundColor: `${color}18` }}
                      >
                        <Feather
                          name={cat.icon as FeatherIcon}
                          size={14}
                          color={color}
                        />
                      </View>
                      <Text className='flex-1 text-[14px] font-medium text-black ml-3'>
                        {cat.name}
                      </Text>
                      <View className='bg-neutral-100 px-2.5 py-1 rounded-full'>
                        <Text className='text-[10px] text-neutral-400 font-medium'>
                          Default
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          <View className='h-16' />
        </ScrollView>
      </View>

      {/* Add Category Modal */}
      <Modal
        visible={showAdd}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowAdd(false)}
      >
        <ScrollView className='flex-1 bg-neutral-50' keyboardShouldPersistTaps='handled'>
          <View className='px-6 pt-5 pb-4 flex-row justify-between items-center border-b border-neutral-100'>
            <Text className='text-[18px] font-bold text-black'>
              Add Category
            </Text>
            <Pressable onPress={() => { setShowAdd(false); setNewName(''); setParentCategory(null); }}>
              <Feather name='x' size={20} color='#000' />
            </Pressable>
          </View>

          <View className='px-6 pt-6'>
            {/* Name */}
            <Text className='text-[13px] font-medium text-neutral-500 mb-2'>
              Category Name
            </Text>
            <View className='bg-white rounded-2xl px-4 py-3.5 mb-6'>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder='e.g. Pet Care, Hobbies...'
                placeholderTextColor='#D4D4D4'
                className='text-[16px] text-black'
                autoFocus
                returnKeyType='done'
                onSubmitEditing={handleAdd}
              />
            </View>

            {/* Parent group — optional */}
            <View className='flex-row items-center gap-2 mb-2'>
              <Text className='text-[13px] font-medium text-neutral-500'>
                Group
              </Text>
              <View className='bg-neutral-200 rounded-full px-2 py-0.5'>
                <Text className='text-[10px] font-semibold text-neutral-400 uppercase tracking-wide'>
                  Optional
                </Text>
              </View>
            </View>

            {/* Why it matters */}
            <View className='bg-blue-50 rounded-2xl px-4 py-3 flex-row items-start gap-3 mb-3'>
              <Feather name='pie-chart' size={14} color='#3B82F6' style={{ marginTop: 1 }} />
              <Text className='flex-1 text-[12px] text-blue-500 leading-5'>
                Grouping lets your spending reports roll up correctly — e.g. "Boba Tea" under Food & Drink shows in the same pie slice as Groceries and Restaurants.{' '}
                <Text className='font-semibold'>Skip it</Text> and this becomes its own standalone group.
              </Text>
            </View>

            <View className='flex-row flex-wrap gap-2 mb-8'>
              {PARENT_CATEGORIES.map((parent) => {
                const color = PARENT_CATEGORY_COLORS[parent];
                const selected = parentCategory === parent;
                return (
                  <Pressable
                    key={parent}
                    onPress={() => setParentCategory(selected ? null : parent)}
                    className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${
                      selected ? 'bg-black' : 'bg-white'
                    }`}
                  >
                    <View
                      className='w-2 h-2 rounded-full'
                      style={{ backgroundColor: selected ? '#fff' : color }}
                    />
                    <Text
                      className={`text-[12px] font-medium ${
                        selected ? 'text-white' : 'text-black'
                      }`}
                    >
                      {parent}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleAdd}
              disabled={!newName.trim() || isSaving}
              className={`py-4 rounded-2xl items-center mb-10 ${
                newName.trim() && !isSaving ? 'bg-black' : 'bg-neutral-300'
              }`}
            >
              <Text className='text-white text-[15px] font-bold'>
                {isSaving ? 'Adding...' : 'Add Category'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>
    </>
  );
}
