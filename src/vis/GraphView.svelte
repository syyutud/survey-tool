<script>
  export let data;

  // 占位数据结构：将来一键替换
  let papers = [
    { id: 1, image: null, url: "", keywords: [] },
    { id: 2, image: null, url: "", keywords: [] },
    { id: 3, image: null, url: "", keywords: [] },
    { id: 4, image: null, url: "", keywords: [] }
  ];
</script>

<div class="graph-content">

  <div class="grid">
    {#each papers as paper}
      <div class="paper-card">

        <div class="image-slot">
          {#if paper.image}
            <img src={paper.image} alt="paper image" />
          {:else}
            <span>Upload Image</span>
          {/if}
        </div>

        <div class="paper-meta">
          <div class="url">
            {paper.url || "URL: (empty)"}
          </div>
          <div class="keywords">
            {paper.keywords.length
              ? paper.keywords.join(", ")
              : "keywords: (empty)"}
          </div>
        </div>

      </div>
    {/each}
  </div>

</div>

<style>
  .graph-content {
    padding: 10px 20px;
    max-height: 420px;
    overflow-y: auto;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 14px;
  }

  .paper-card {
    font-size: 11px;
  }

  .image-slot {
    height: 120px;
    border: 1px dashed #555;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    margin-bottom: 6px;
  }

  .image-slot img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .paper-meta {
    opacity: 0.75;
    line-height: 1.3;
  }
</style>
