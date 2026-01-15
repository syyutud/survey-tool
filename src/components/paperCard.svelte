<script>
  import { Card, Button, Modal } from "flowbite-svelte";
  // @ts-ignore
  import { LinkSolid, CopySolid } from "flowbite-svelte-icons";
  import { Tooltip } from "flowbite-svelte";
  import { copyText } from "svelte-copy";
  import PaperDetail from "./paperDetail.svelte";

  import { hoveredPaperKey } from "../store";

  export let paper;
  export let structure;
  export let meta;
  export let index;

  let open = false;

  // ✅ 与 GraphView 完全一致的 key 规则（并做 trim 防止空格导致对不上）
  $: myKey =
    (paper?.DOI ?? "").trim() !== ""
      ? `doi:${(paper.DOI ?? "").trim()}`
      : `name:${paper?.Name ?? ""}-${paper?.Year ?? ""}`;

  // ✅ DOI 安全打开
  function openDoi(p) {
    const doi = (p?.DOI ?? "").trim();
    if (!doi) return;
    window.open(doi.startsWith("10") ? "https://doi.org/" + doi : doi);
  }
</script>

<Tooltip trigger="click" triggeredBy={"#entry-" + index} placement="left"
  >Copied Bibtex to clipboard!</Tooltip
>

<Modal
  title="Paper Details"
  size="lg"
  id="modal"
  bind:open={open}
  outsideclose
  autoclose={false}
>
  <PaperDetail {paper} detailView={structure.detailView} {meta} />
</Modal>

<Card
  on:click={() => {
    open = true;
  }}
  class="w-full m-1 dark:bg-[#212125] dark:shadow-xl {$hoveredPaperKey === myKey ? 'highlight-paper' : ''}"
  style="cursor: pointer; max-width: 95%; float: right"
  padding="none"
>
  <div class="grid grid-cols-7">
    <div class="ml-2 col-span-6">
      <span class="dark:text-white">
        {paper.Name}
        <span class="text-gray-400">{paper.Year}</span>
      </span>
    </div>

    <div>
      <Button
        on:click={(event) => {
          event.stopPropagation();
          openDoi(paper);
        }}
        outline={true}
        size="xs"
        pill={true}
        class="!p-2 mb-2 mr-0.5 border-0 float-right"
      >
        <LinkSolid class="w-4 h-4" />
      </Button>

      {#if paper.Bibtex}
        <Button
          id={"entry-" + index}
          on:click={(event) => {
            event.stopPropagation();
            copyText(paper.Bibtex);
          }}
          outline={true}
          size="xs"
          pill={true}
          class="!p-2 mb-2 mr-1 border-0 float-right"
        >
          <CopySolid class="w-4 h-4" />
        </Button>
      {/if}
    </div>
  </div>
</Card>

<style>
  .highlight-paper {
    background-color: #fff59d !important; /* 荧光黄 */
    box-shadow: 0 0 0 3px rgba(255, 235, 59, 0.8);
  }

  .dark .highlight-paper {
    background-color: #5c5300 !important; /* dark 模式不刺眼 */
  }
</style>
