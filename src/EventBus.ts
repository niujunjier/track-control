type EventCb = (...args: any[]) => void;

export default class BaseClass {
  private _cache: Record<string, EventCb[]> = {};
  // 绑定
  on(type: string, callback: EventCb) {
    const fns = (this._cache[type] = this._cache[type] || []);
    if (fns.indexOf(callback) === -1) {
      fns.push(callback);
    }
    return this;
  }

  emit(type: string, ...args: any[]) {
    const fns = this._cache[type];
    if (Array.isArray(fns)) {
      fns.forEach((fn) => {
        fn(...args);
      });
    }
    return this;
  }

  off(type: string, callback: EventCb) {
    const fns = this._cache[type];
    if (Array.isArray(fns)) {
      if (callback) {
        const index = fns.indexOf(callback);
        if (index !== -1) {
          fns.splice(index, 1);
        }
      } else {
        // 全部清空
        fns.length = 0;
      }
    }
    return this;
  }
}
