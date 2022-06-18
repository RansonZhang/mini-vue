const queue: any[] = [];
const promise = Promise.resolve();
let isFlushPending = false;

export function nextTick(fn?) {
  return fn ? promise.then(fn) : promise;
}

export function queueJobs(job: any) {
  if (queue.includes(job)) return;

  queue.push(job);
  queueFlush();
}

function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;

  nextTick(flushJobs);
}

function flushJobs() {
  isFlushPending = false;
  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}
