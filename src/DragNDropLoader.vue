<style lang="stylus" scoped>
.root-drag-n-drop-loader
  &::before
  &::after
    content 'Изменить'
    position absolute
    inset 0
    display flex
    align-items center
    justify-content center
    text-align center
    border-radius 999999999px
    overflow hidden
    font-family inherit
    font-size 1rem
    color white
    background #000000AA
    z-index 1
    opacity 0
    transition opacity 0.3s ease
    cursor pointer

  &::after
    content 'Отпустите, чтобы загрузить'

  &:hover::before
    opacity 1

  &.in-drag
    &::after
      opacity 1

.root-drag-n-drop-loader.disabled
  &::after
  &::before
    content none
</style>

<template>
  <div class="root-drag-n-drop-loader" :class="{'in-drag': isInDrag, disabled}"
     @dragenter="isInDrag = true"
     @dragleave="isInDrag = false"
     @dragover.prevent="isInDrag = true"
     @drop.prevent="handleDrop"
     @click="getUserImage"
  >
    <slot></slot>
  </div>
</template>

<script>
import {loadImageInBase64, draggedImageToBase64} from "./index"


export default {
  emits: ['load', 'error'],

  props: {
    cropToSquare: {
      type: Boolean,
      required: true,
    },
    compressSize: {
      type: Number,
      required: true,
    },
    maxAllowedSize: {
      type: Number,
      default: Infinity,
    },
    disabled: Boolean,
  },

  data() {
    return {
      isInDrag: false,
    }
  },

  methods: {
    async handleDrop(event) {
      this.isInDrag = false;
      this.$emit('load', await draggedImageToBase64(event.dataTransfer, this.cropToSquare, this.compressSize, this.maxAllowedSize));
    },

    async getUserImage() {
      if (this.disabled) {
        return;
      }
      let dataURL;
      try {
        dataURL = await loadImageInBase64(this.cropToSquare, this.compressSize, Infinity);
        this.$emit('load', dataURL);
      } catch (err) {
        this.$emit('error', `Ошибка загрузки изображения: ${err}`);
      }
    }
  }
};
</script>
