import { Modal, Pressable, Text, View } from 'react-native';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-black/50 items-center justify-center px-8">
        <View className="bg-white rounded-2xl w-full p-6">
          <Text className="text-[18px] font-bold text-black text-center">
            {title}
          </Text>
          <Text className="text-[14px] text-neutral-500 text-center mt-3 leading-5">
            {message}
          </Text>

          <View className="flex-row gap-3 mt-6">
            <Pressable
              onPress={onCancel}
              className="flex-1 py-3.5 rounded-xl items-center bg-neutral-100"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-[14px] font-semibold text-black">
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 py-3.5 rounded-xl items-center ${
                destructive ? 'bg-red-500' : 'bg-black'
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-[14px] font-semibold text-white">
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
