<script>
import { hoveredPaperKey } from "../store";  
export let data = [];

  // ---- 1) 测试数据：当 data 为空时用于占位，保证页面可运行 ----
  const fallbackPapers = [
    { Name: "Paper A", Year: "2025", DOI: "", Topic: [] },
    { Name: "Paper B", Year: "2025", DOI: "", Topic: [] },
    { Name: "Paper C", Year: "2024", DOI: "", Topic: [] },
    { Name: "Paper D", Year: "2024", DOI: "", Topic: [] },
    { Name: "Paper E", Year: "2023", DOI: "", Topic: [] },
    { Name: "Paper F", Year: "2023", DOI: "", Topic: [] },
  ];

  // 实际用于渲染的列表：优先使用传入的 data
  $: papers = (Array.isArray(data) && data.length > 0) ? data : fallbackPapers;

  // ---- 2) 本地图片缓存（仅前端预览，不写回数据文件）----
  // key 用 index 足够稳定（因为 papers 是当前 view 的顺序）
  let imgByIndex = {};

  function onPickFile(index, e) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    imgByIndex = { ...imgByIndex, [index]: url };
  }

  // ---- 3) URL & keywords 显示：先用简单策略，后续你找到源头可“一键替换” ----
  // URL：优先 DOI（如果是 10... 则拼成 doi.org），否则空
  function paperUrl(p) {
    if (!p) return "";
    const doi = (p.DOI || "").trim();
    if (!doi) return "";
    return doi.startsWith("10") ? `https://doi.org/${doi}` : doi;
  }

  // keywords：先优先 Topic，如果没有 Topic，就自动找 paper 中的数组字段当 keywords
  function paperKeywords(p) {
    if (!p) return [];
    if (Array.isArray(p.Topic) && !(p.Topic.length === 1 && p.Topic[0] === "")) {
      return p.Topic.filter(Boolean);
    }
    // fallback：抽取所有 array 字段（排除 Authors 等你可能不想当 keyword 的）
    const blacklist = new Set(["Authors", "Bibtex"]);
    const res = [];
    Object.entries(p).forEach(([k, v]) => {
      if (blacklist.has(k)) return;
      if (Array.isArray(v)) {
        v.filter(Boolean).forEach((x) => res.push(String(x)));
      }
    });
    return res;
  }

// ✅ 生成稳定 key：优先 DOI，否则 Name-Year
  const paperKey = (p) => (p?.DOI ? `doi:${p.DOI}` : `name:${p?.Name ?? ""}-${p?.Year ?? ""}`);

</script>

<div class="graph-content">
  <div class="grid">
   {#each papers as paper, i}
  <div
    class="paper-card"
    on:mouseenter={() => hoveredPaperKey.set(paperKey(paper))}
    on:mouseleave={() => hoveredPaperKey.set(null)}
  >
        <div class="image-slot">
          {#if imgByIndex[i]}
            <img src={imgByIndex[i]} alt="uploaded preview" />
          {:else}
            <div class="upload-hint">
              <div class="upload-title">Upload Image</div>
              <div class="upload-sub">PNG/JPG</div>
            </div>
          {/if}

          <!-- 透明 file input 覆盖整个框，点击就选择文件 -->
          <input
            class="file-input"
            type="file"
            accept="image/*"
            on:change={(e) => onPickFile(i, e)}
          />
        </div>

        <div class="paper-meta">
          <div class="title">
            {paper.Name || "Untitled"} <span class="year">{paper.Year || ""}</span>
          </div>

          <div class="url">
            {#if paperUrl(paper)}
              <a href={paperUrl(paper)} target="_blank" rel="noreferrer">{paperUrl(paper)}</a>
            {:else}
              <span class="empty">URL: (empty)</span>
            {/if}
          </div>

          <div class="keywords">
            {#if paperKeywords(paper).length > 0}
              keywords: {paperKeywords(paper).slice(0, 6).join(", ")}
            {:else}
              <span class="empty">keywords: (empty)</span>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .graph-content {
    padding: 10px 20px;
    max-height: 520px;
    overflow-y: auto;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 14px;
  }

  .paper-card {
    font-size: 11px;
  }

  .image-slot {
    position: relative;
    height: 140px;
    border: 1px dashed #555;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.9;
    margin-bottom: 8px;
  }

  .image-slot img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .upload-hint {
    text-align: center;
    opacity: 0.75;
    user-select: none;
  }
  .upload-title {
    font-weight: 600;
    margin-bottom: 2px;
  }
  .upload-sub {
    font-size: 10px;
    opacity: 0.85;
  }

  .file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .paper-meta {
    opacity: 0.85;
    line-height: 1.35;
  }

  .title {
    font-weight: 600;
    margin-bottom: 4px;
  }
  .year {
    margin-left: 6px;
    opacity: 0.7;
  }

  .url a {
    word-break: break-all;
    text-decoration: underline;
  }

  .empty {
    opacity: 0.7;
  }
</style>
