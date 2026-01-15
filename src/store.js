import { writable } from "svelte/store";

export const filterBy = writable([]);
export const timeFilters = writable({ start: 0, end: 9999 });
export const searchFilter = writable("");

export const urlParams = writable(new URLSearchParams(window.location.search));

/* GraphView UI 状态（新增）*/
export const showGraphView = writable(false);
export const hoveredPaperKey = writable(null);

let prevUrl = undefined;
setInterval(() => {
  const currUrl = window.location.href;
  if (currUrl != prevUrl) {
    // URL changed
    prevUrl = currUrl;
    urlParams.set(new URLSearchParams(window.location.search));
  }
}, 60);
