
// Helper for concurrency control
export const pLimit = (concurrency: number) => {
  const queue: any[] = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      queue.shift()();
    }
  };

  const run = async (fn: any, resolve: any, reject: any) => {
    activeCount++;
    const result = (async () => fn())();
    try {
      const res = await result;
      resolve(res);
    } catch (err) {
      reject(err);
    } finally {
      next();
    }
  };

  const enqueue = (fn: any, resolve: any, reject: any) => {
    queue.push(() => run(fn, resolve, reject));
    if (activeCount < concurrency && queue.length > 0) {
      queue.shift()();
    }
  };

  const generator = (fn: any) =>
    new Promise((resolve, reject) => {
      enqueue(fn, resolve, reject);
    });

  return generator;
};
