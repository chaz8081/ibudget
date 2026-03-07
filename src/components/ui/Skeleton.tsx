import { useEffect, useRef } from "react";
import { View, Animated, type DimensionValue } from "react-native";

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  className?: string;
};

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, className }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={className}
      style={[
        {
          width,
          height,
          borderRadius,
          opacity,
        },
      ]}
    />
  );
}

/** Card-shaped skeleton */
export function SkeletonCard() {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3">
      <View className="flex-row items-center mb-3">
        <Skeleton width={40} height={40} borderRadius={20} className="bg-gray-200 dark:bg-gray-700 mr-3" />
        <View className="flex-1">
          <Skeleton width="60%" height={14} className="bg-gray-200 dark:bg-gray-700 mb-2" />
          <Skeleton width="40%" height={12} className="bg-gray-200 dark:bg-gray-700" />
        </View>
      </View>
      <Skeleton width="100%" height={8} className="bg-gray-200 dark:bg-gray-700" />
    </View>
  );
}

/** List of skeleton cards */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View className="px-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

/** Detail view skeleton */
export function SkeletonDetail() {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950 px-4 pt-4">
      <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4">
        <Skeleton width="50%" height={28} className="bg-gray-200 dark:bg-gray-700 mb-3 self-center" />
        <View className="gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} className="flex-row justify-between">
              <Skeleton width="30%" height={14} className="bg-gray-200 dark:bg-gray-700" />
              <Skeleton width="40%" height={14} className="bg-gray-200 dark:bg-gray-700" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Dashboard skeleton with summary + list */
export function SkeletonDashboard() {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Month picker skeleton */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Skeleton width={24} height={24} borderRadius={12} className="bg-gray-200 dark:bg-gray-700" />
        <Skeleton width={140} height={20} className="bg-gray-200 dark:bg-gray-700" />
        <Skeleton width={24} height={24} borderRadius={12} className="bg-gray-200 dark:bg-gray-700" />
      </View>
      {/* Budget summary skeleton */}
      <View className="bg-white dark:bg-gray-800 rounded-2xl mx-4 p-4 mb-4">
        <View className="flex-row justify-between mb-3">
          <Skeleton width="45%" height={40} className="bg-gray-200 dark:bg-gray-700" />
          <Skeleton width="45%" height={40} className="bg-gray-200 dark:bg-gray-700" />
        </View>
        <Skeleton width="100%" height={8} borderRadius={4} className="bg-gray-200 dark:bg-gray-700" />
      </View>
      {/* Buttons skeleton */}
      <View className="flex-row px-4 mb-4 gap-2">
        <Skeleton width="48%" height={48} borderRadius={12} className="bg-gray-200 dark:bg-gray-700" />
        <Skeleton width="48%" height={48} borderRadius={12} className="bg-gray-200 dark:bg-gray-700" />
      </View>
      {/* List skeleton */}
      <SkeletonList count={3} />
    </View>
  );
}
