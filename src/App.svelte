<script>
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { P, Button, Drawer, Heading } from "flowbite-svelte";
  import { CloseSolid, ReplyOutline } from "flowbite-svelte-icons";
  import PaperCard from "./components/paperCard.svelte";
  import FilterPanel from "./filterPanel.svelte";
  import Header from "./header.svelte";
  import Vis from "./vis.svelte";
  import structureRaw from "./data/survey-config.json";
  import dataMetaRaw from "./data/survey-data.json";
  import { searchFilter, timeFilters, filterBy } from "./store";
  import { sineIn } from "svelte/easing";
  import SearchField from "./components/searchField.svelte";

  let transitionParams = { x: -320, duration: 200, easing: sineIn };
  let headerPx = 45;
  let backdrop = false;
  let activateClickOutside = true;
  let drawerHidden = false;
  let innerHeight = 0;
  let innerWidth = 0;
  let showVis = true;
  let showPapers = true;

  let filteredData = [];
  let meta = {};
  let freq = {};
  let filteredFreq = {};
  let selectTopics = [];

  /**
   * ✅ Normalize config & data schema
   * 兼容你之前的测试版/脚本版/旧版结构，避免任何字段缺失导致白屏
   */
  function normalizeStructure(s) {
    const safe = s ?? {};

    // detailView / summaryView 允许是数组或对象，统一成 { show: [] }
    const detailView =
      Array.isArray(safe.detailView)
        ? { view: "normal", show: safe.detailView }
        : (safe.detailView ?? { view: "normal", show: [] });

    const summaryView =
      Array.isArray(safe.summaryView)
        ? { view: "text", showImg: false, show: safe.summaryView }
        : (safe.summaryView ?? { view: "text", showImg: false, show: [] });

    const topView =
      Array.isArray(safe.topView)
        ? { title: safe.topView?.[0] ?? "Survey", description: "", authors: "", addEntry: { description: [], github: "" } }
        : (safe.topView ?? { title: "Survey", description: "", authors: "", addEntry: { description: [], github: "" } });

    // filterBy：允许是 ["Topic"] 或 [{name:"Topic"}] 或 groupName 结构
    let filterByArr = safe.filterBy ?? [];
    if (Array.isArray(filterByArr) && filterByArr.length > 0 && typeof filterByArr[0] === "string") {
      filterByArr = filterByArr.map((name) => ({ name }));
    }

    return { ...safe, filterBy: filterByArr, detailView, summaryView, topView };
  }

  function normalizeData(d) {
    const safe = d ?? {};
    return {
      meta: Array.isArray(safe.meta) ? safe.meta : [],
      data: Array.isArray(safe.data) ? safe.data : []
    };
  }

  const structure = normalizeStructure(structureRaw);
  const dataMeta = normalizeData(dataMetaRaw);

  // ✅ build meta dict safely
  meta = {};
  (dataMeta.meta ?? []).forEach((prop) => {
    if (prop?.name) meta[prop.name] = prop;
  });

  // ✅ init filterBy store safely
  $filterBy = Array.isArray(structure.filterBy) ? structuredClone(structure.filterBy) : [];

  // ensure selected exists for MultiSelect filters
  $filterBy.forEach((prop) => {
    if (prop?.values) {
      if (prop.name in meta && meta[prop.name]?.type === "MultiSelect") prop.selected = prop.selected ?? [];
    } else if (prop?.categories) {
      prop.categories.forEach((option) => {
        if (option?.name in meta && meta[option.name]?.type === "MultiSelect") {
          option.selected = option.selected ?? [];
        }
      });
    } else {
      // 最低限度兜底：没有 values/categories 的 filter 也别让它炸
      prop.selected = prop.selected ?? [];
    }
  });

  // ✅ compute missing values from data (this is what enables “one-click import” later)
  function addMissingValues() {
    $filterBy.forEach((group) => {
      if (group && "groupName" in group && Array.isArray(group.categories)) {
        group.categories.forEach((cate) => {
          const needsFill = !Array.isArray(cate.values) || cate.values.length === 0;
          if (needsFill) {
            const topics = new Set();
            dataMeta.data.forEach((paper) => {
              const v = paper?.[cate.name];
              if (Array.isArray(v)) v.forEach((w) => w && topics.add(w));
            });
            cate.values = [...topics];
          }
          cate.selected = cate.selected ?? [];
        });
      } else if (group?.name) {
        const needsFill = !Array.isArray(group.values) || group.values.length === 0;
        if (needsFill) {
          const topics = new Set();
          dataMeta.data.forEach((paper) => {
            const v = paper?.[group.name];
            if (Array.isArray(v)) v.forEach((w) => w && topics.add(w));
          });
          group.values = [...topics];
        }
        group.selected = group.selected ?? [];
      }
    });

    $filterBy = $filterBy;
  }

  addMissingValues();

  // ✅ freq counter (also safe)
  function freqCount(prop, arrValue, freqDict) {
    if (prop in meta && meta[prop]?.type === "MultiSelect") {
      if (!Array.isArray(arrValue)) return;
      if (arrValue.length === 1 && arrValue[0] === "") return;
      arrValue.forEach((value) => {
        if (!value) return;
        if (prop in freqDict) {
          freqDict[prop][value] ? freqDict[prop][value]++ : (freqDict[prop][value] = 1);
        } else {
          freqDict[prop] = {};
          freqDict[prop][value] = 1;
        }
      });
    }
  }

  // init full freq
  freq = {};
  dataMeta.data.forEach((paper) => {
    Object.entries(paper).forEach(([prop, arrValue]) => {
      freqCount(prop, arrValue, freq);
    });
    paper["selected"] = false;
  });

  function applyFilters(searchFilter, timeFilters, filterByLocal) {
    filteredFreq = {};
    let startingPoint = [...dataMeta.data];

    if (searchFilter !== "" && searchFilter.length > 2) {
      startingPoint = startingPoint.filter((paper) =>
        (paper?.Name ?? "").toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    if (timeFilters?.start > 0) {
      startingPoint = startingPoint.filter(
        (paper) => timeFilters.start <= +paper.Year && +paper.Year <= timeFilters.end
      );
    }

    const re = new RegExp("([0-9]+)");

    filterByLocal.forEach((group) => {
      if (group?.values) {
        if (group.selected && group.selected.length > 0) {
          const selected = group.selected.map((sel) => (re.test(sel) ? sel.split(") ")[1] : sel));
          let res = [];
          startingPoint.forEach((paper) => {
            let found = false;
            const val = paper?.[group.name];
            if (Array.isArray(val)) {
              found = selected.every((p) => val.includes(p));
            } else if (typeof val === "string") {
              found = selected.includes(val);
            }
            if (found) res.push(paper);
          });
          startingPoint = res;
        }
      } else if (group?.categories) {
        group.categories.forEach((option) => {
          if (option.selected && option.selected.length > 0) {
            const selected = option.selected.map((sel) => (re.test(sel) ? sel.split(") ")[1] : sel));
            let res = [];
            startingPoint.forEach((paper) => {
              let found = false;
              const val = paper?.[option.name];
              if (Array.isArray(val)) {
                found = selected.every((p) => val.includes(p));
              } else if (typeof val === "string") {
                found = selected.includes(val);
              }
              if (found) res.push(paper);
            });
            startingPoint = res;
          }
        });
      }
    });

    // recompute filtered freq safely
    startingPoint.forEach((paper) => {
      Object.entries(paper).forEach(([prop, arrValue]) => {
        freqCount(prop, arrValue, filteredFreq);
      });
    });

    filteredData = startingPoint.sort((p1, p2) => (+p1.Year < +p2.Year ? 1 : -1));

    // selected topics list
    selectTopics = [];
    filterByLocal.forEach((filter) => {
      if (filter && "groupName" in filter && Array.isArray(filter.categories)) {
        filter.categories.forEach((cate) => (selectTopics = selectTopics.concat(cate.selected ?? [])));
      } else {
        selectTopics = selectTopics.concat(filter?.selected ?? []);
      }
    });

    filterByLocal = [...filterByLocal];
  }

  function toggleView() {
    if (showVis) {
      showVis = false;
      showPapers = true;
    } else {
      showVis = true;
      showPapers = false;
    }
  }

  let breakPoint = 1024;
  let width;
  $: width = innerWidth;
  $: if (width >= breakPoint) {
    drawerHidden = false;
    activateClickOutside = false;
    showVis = true;
    showPapers = true;
  } else {
    drawerHidden = true;
    activateClickOutside = true;
    showVis = false;
    showPapers = true;
  }

  $: applyFilters($searchFilter, $timeFilters, $filterBy);

  const clearSelections = () => {
    $filterBy.forEach((prop) => {
      if (prop?.values) prop.selected = [];
      else if (prop?.categories) prop.categories.forEach((option) => (option.selected = []));
    });
    $filterBy = $filterBy;
  };
</script>


<svelte:head>
    <title>{structure.topView.title}</title> 
</svelte:head>
<svelte:window bind:innerHeight bind:innerWidth />

<Header
  detailView={structure.detailView.show}
  topView={structure.topView}
  {freq}
  closeFn={() => (drawerHidden = !drawerHidden)}
  toggleParams={ {
    hidden: width >= breakPoint,
    func: toggleView,
    vis: showVis,
    papers: showPapers
  }}
  showTitle={!drawerHidden}
  {headerPx}
/>

<Drawer
  transitionType="fly"
  {backdrop}
  {transitionParams}
  bind:hidden={drawerHidden}
  bind:activateClickOutside
  id="sidebar"
>
  <div class="flex">
    <Heading tag="h5">{structure.topView.title}</Heading>
    <Button
      pill={true}
      outline
      class="!p-1 border-0"
      size="xs"
      on:click={() => (drawerHidden = !drawerHidden)}
    >
      <CloseSolid class="w-4 h-4" />
    </Button>
  </div>
  <hr style="margin:15px" />

  <div class="fliter-papers">
    <Heading tag="h6">Filters:</Heading>
    <Button
      pill={true}
      outline
      class="!p-1 border-0"
      size="xs"
      on:click={clearSelections}
    >
      <ReplyOutline class="w-5 h-5" />
    </Button>
  </div>

  <div class="m-5">
    <SearchField />
  </div>
  
  <FilterPanel
    {freq}
    {selectTopics}
    {filteredData}
    data={dataMeta.data}
  />
</Drawer>

<main class="mx-auto">
  <!--  -->
  <Splitpanes 
    style="height:{innerHeight - headerPx}px;width:{innerWidth +
      (width <= breakPoint || drawerHidden
        ? 2
        : transitionParams.x + 2)}px;float: right;position:initial;"
  >
    {#if showVis}
      <Pane size={showPapers ? 70 : 100}>
        <Vis data={filteredData} />
      </Pane>
    {/if}

    {#if showPapers}
      <Pane>
        <div class="num-papers dark:bg-gray-900">
          <P>Number of papers: {filteredData.length}/{dataMeta.data.length}</P>
        </div>

        <div class="card-container dark:bg-gray-900">
          {#each filteredData as paper, i}
            <PaperCard
              index={i}
              {paper}
              {structure}
              {meta}
            />
          {/each}
        </div>
      </Pane>
    {/if}
  </Splitpanes>
</main>

<style>
  .card-container {
    height: calc(100% - 44px);
    overflow: auto;
  }
  .num-papers {
    padding: 10px 10px;
    display: flex;
    justify-content: space-between;
  }
  .fliter-papers {
    padding: 0px 0px 0px 0px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
