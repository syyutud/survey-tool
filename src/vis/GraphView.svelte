<script>
  // 之后你可以把 images 当成 props 传进来
  export let images = [];
</script>

<div class="graph-view-container">
  {#if images.length === 0}
    <!-- 空白占位态 -->
    <div class="empty-state">
      <div class="grid">
        {#each Array(12) as _, i}
          <div class="grid-item placeholder">
            <div class="img-box"></div>
            <a href="javascript:void(0)">link #{i + 1}</a>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <!-- 真实数据态（以后再接） -->
    <div class="grid">
      {#each images as img}
        <div class="grid-item">
          <img src={img.src} alt={img.title} />
          <a href={img.link} target="_blank">{img.title}</a>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .graph-view-container {
    height: 100%;
    overflow-y: auto; /* 关键：中间区域可滚动 */
    padding: 16px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }

  .grid-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
  }

  .grid-item a {
    color: #4ea1ff;
    text-decoration: none;
    cursor: pointer;
  }

  .grid-item a:hover {
    text-decoration: underline;
  }

  /* 占位样式 */
  .placeholder .img-box {
    width: 100%;
    aspect-ratio: 1 / 1;
    background: linear-gradient(
      90deg,
      #2a2a2a 25%,
      #333 37%,
      #2a2a2a 63%
    );
    background-size: 400% 100%;
    animation: shimmer 1.4s ease infinite;
    border-radius: 6px;
  }

  @keyframes shimmer {
    0% { background-position: 100% 0; }
    100% { background-position: 0 0; }
  }

  .empty-state {
    opacity: 0.8;
  }
</style>
