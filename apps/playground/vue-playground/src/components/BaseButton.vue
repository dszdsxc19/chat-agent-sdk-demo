<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  active: boolean;
  variant?: 'default' | 'danger';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>();

const style = computed(() => {
  const colors = props.variant === 'danger'
    ? { bg: props.active ? '#d32f2f' : '#f44336', hover: '#e53935' }
    : { bg: props.active ? '#0056b3' : '#007bff', hover: '#0056b3' };

  return {
    padding: "8px 12px",
    backgroundColor: colors.bg,
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "background-color 0.2s",
  };
});

const handleMouseEnter = (e: MouseEvent) => {
  if (!props.active) {
    const target = e.currentTarget as HTMLElement;
    const colors = props.variant === 'danger'
      ? { hover: '#e53935' }
      : { hover: '#0056b3' };
    target.style.backgroundColor = colors.hover;
  }
};

const handleMouseLeave = (e: MouseEvent) => {
  if (!props.active) {
     const target = e.currentTarget as HTMLElement;
     const colors = props.variant === 'danger'
      ? { bg: '#f44336' }
      : { bg: '#007bff' };
    target.style.backgroundColor = colors.bg;
  }
};
</script>

<template>
  <button
    :style="style"
    @click="emit('click', $event)"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <slot></slot>
  </button>
</template>
