<style lang="stylus" scoped>
.root-drag-n-drop-loader
  cursor pointer
  &::before
  &::after
    content 'Изменить'
    position absolute
    inset 0
    display flex
    align-items center
    justify-content center
    text-align center
    font-family inherit
    font-size 1rem
    color white
    background #000000AA
    z-index 1
    opacity 0
    transition opacity 0.3s ease
    pointer-events none

  &::after
    content 'Отпустите, чтобы загрузить'

  &:hover::before
    opacity 1

  &.in-drag
    &::after
      opacity 1

.root-drag-n-drop-loader.disabled
  &::before
  &::after
    content none
.root-drag-n-drop-loader.no-hover
  &::before
    content none
</style>

<template>
  <div class="root-drag-n-drop-loader" :class="{'in-drag': isInDrag, disabled, 'no-hover': !worksOnClick}"
     @dragenter="worksOnDragNDrop ? (isInDrag = true) : null"
     @dragleave="worksOnDragNDrop ? (isInDrag = false) : null"
     @dragover.prevent="worksOnDragNDrop ? (isInDrag = true) : null"
     @drop.prevent="_handleDrop"
     @click="_handleClick"
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
    worksOnClick: {
      type: Boolean,
      default: true,
    },
    worksOnDragNDrop: {
      type: Boolean,
      default: true,
    },
    disabled: Boolean,
  },

  data() {
    return {
      isInDrag: false,
    }
  },

  methods: {
    async _handleDrop(event) {
      if (!this.worksOnDragNDrop) {
        return;
      }
      if (this.disabled) {
        return;
      }
      this.isInDrag = false;

      let dataURL;
      try {
        dataURL = await draggedImageToBase64(event.dataTransfer, this.cropToSquare, this.compressSize, this.maxAllowedSize);
        this.$emit('load', dataURL);
      } catch (err) {
        this.$emit('error', `Ошибка загрузки изображения: ${err}`);
      }
    },

    async _handleClick(event) {
      if (!this.worksOnClick) {
        return;
      }
      if (this.disabled) {
        return;
      }
      this.isInDrag = false;
      this.$emit('load', await this.loadUserImage());
    },

    async loadUserImage() {
      let dataURL;
      try {
        dataURL = await loadImageInBase64(this.cropToSquare, this.compressSize, this.maxAllowedSize);
        this.$emit('load', dataURL);
      } catch (err) {
        this.$emit('error', `Ошибка загрузки изображения: ${err}`);
      }
    }
  }
};
</script>
