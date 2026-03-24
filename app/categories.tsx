import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { useAuthenticatedUserId } from '@/lib/hooks/useAuthenticatedUserId';
import { useCachedParentCategories } from '@/lib/hooks/useCachedParentCategories';
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
  const authenticatedUserId = useAuthenticatedUserId();

  const categories = useQuery(
    api.categories.list,
    authenticatedUserId ? { userId: authenticatedUserId } : 'skip'
  );
  const createCategory = useMutation(api.categories.create);
  const removeCategory = useMutation(api.categories.remove);
  const parentCategoriesFromHook = useCachedParentCategories();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const customCategories = (categories ?? []).filter((c) => !c.isDefault);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!userId || !trimmed || isSaving) return;
    setIsSaving(true);
    try {
      const parent = parentCategoriesFromHook.find((p) => p._id === selectedParentId);
      const color = parent?.color ?? '#6B7280';
      await createCategory({
        userId,
        name: trimmed,
        icon: 'tag',
        type: 'expense',
        color,
        parentCategoryId: selectedParentId ? (selectedParentId as any) : undefined,
      });
      setNewName('');
      setSelectedParentId(null);
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
          {/* Categories grouped by parent from DB */}
          {parentCategoriesFromHook.map((parent) => {
            const subCats = (categories ?? []).filter(
              (c) => (c as any).parentCategoryId === parent._id
            );
            if (subCats.length === 0) return null;
            const color = parent.color;
            return (
              <View key={parent._id} className='mx-6 mb-4'>
                <View className='flex-row items-center gap-2 mb-2 ml-1'>
                  <View
                    className='w-2 h-2 rounded-full'
                    style={{ backgroundColor: color }}
                  />
                  <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider'>
                    {parent.name}
                  </Text>
                </View>
                <View className='bg-white rounded-2xl px-4'>
                  {subCats.map((cat, i) => (
                    <View
                      key={cat._id}
                      className={`flex-row items-center py-3 ${
                        i < subCats.length - 1
                          ? 'border-b border-neutral-100'
                          : ''
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
                      {!cat.isDefault ? (
                        <View className='flex-row items-center gap-2'>
                          <View className='bg-black px-2.5 py-1 rounded-full'>
                            <Text className='text-[10px] text-white font-medium'>
                              Custom
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => handleDelete(cat._id, cat.name)}
                            className='w-7 h-7 items-center justify-center'
                          >
                            <Feather name='trash-2' size={14} color='#EF4444' />
                          </Pressable>
                        </View>
                      ) : (
                        <View className='bg-neutral-100 px-2.5 py-1 rounded-full'>
                          <Text className='text-[10px] text-neutral-400 font-medium'>
                            Default
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          {/* Standalone custom categories (no parent group) */}
          {(categories ?? []).filter((c) => !c.isDefault && !(c as any).parentCategoryId).length > 0 && (
            <View className='mx-6 mb-4'>
              <View className='flex-row items-center gap-2 mb-2 ml-1'>
                <View className='w-2 h-2 rounded-full bg-neutral-400' />
                <Text className='text-[11px] font-semibold text-neutral-400 uppercase tracking-wider'>
                  My Categories
                </Text>
              </View>
              <View className='bg-white rounded-2xl px-4'>
                {(categories ?? [])
                  .filter((c) => !c.isDefault && !(c as any).parentCategoryId)
                  .map((cat, i, arr) => (
                    <View
                      key={cat._id}
                      className={`flex-row items-center py-3 ${
                        i < arr.length - 1 ? 'border-b border-neutral-100' : ''
                      }`}
                    >
                      <View
                        className='w-8 h-8 rounded-lg items-center justify-center'
                        style={{ backgroundColor: `${cat.color}18` }}
                      >
                        <Feather
                          name={cat.icon as FeatherIcon}
                          size={14}
                          color={cat.color}
                        />
                      </View>
                      <Text className='flex-1 text-[14px] font-medium text-black ml-3'>
                        {cat.name}
                      </Text>
                      <View className='flex-row items-center gap-2'>
                        <View className='bg-black px-2.5 py-1 rounded-full'>
                          <Text className='text-[10px] text-white font-medium'>
                            Custom
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => handleDelete(cat._id, cat.name)}
                          className='w-7 h-7 items-center justify-center'
                        >
                          <Feather name='trash-2' size={14} color='#EF4444' />
                        </Pressable>
                      </View>
                    </View>
                  ))}
              </View>
            </View>
          )}

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
        <ScrollView
          className='flex-1 bg-neutral-50'
          keyboardShouldPersistTaps='handled'
        >
          <View className='px-6 pt-5 pb-4 flex-row justify-between items-center border-b border-neutral-100'>
            <Text className='text-[18px] font-bold text-black'>
              Add Category
            </Text>
            <Pressable
              onPress={() => {
                setShowAdd(false);
                setNewName('');
                setSelectedParentId(null);
              }}
            >
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
              <Feather
                name='pie-chart'
                size={14}
                color='#3B82F6'
                style={{ marginTop: 1 }}
              />
              <Text className='flex-1 text-[12px] text-blue-500 leading-5'>
                Grouping lets your spending reports roll up correctly — e.g.
                "Boba Tea" under Food & Drink shows in the same pie slice as
                Groceries and Restaurants.{' '}
                <Text className='font-semibold'>Skip it</Text> and this becomes
                its own standalone group.
              </Text>
            </View>

            <View className='flex-row flex-wrap gap-2 mb-8'>
              {parentCategoriesFromHook.map((parent) => {
                const selected = selectedParentId === parent._id;
                return (
                  <Pressable
                    key={parent._id}
                    onPress={() => setSelectedParentId(selected ? null : parent._id)}
                    className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${
                      selected ? 'bg-black' : 'bg-white'
                    }`}
                  >
                    <Feather
                      name={parent.icon as FeatherIcon}
                      size={11}
                      color={selected ? '#fff' : parent.color}
                    />
                    <Text
                      className={`text-[12px] font-medium ${
                        selected ? 'text-white' : 'text-black'
                      }`}
                    >
                      {parent.name}
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
