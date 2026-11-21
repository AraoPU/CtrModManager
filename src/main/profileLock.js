'use strict';

const path = require('node:path');

// Profile 级异步互斥锁。
//
// mods.yml / installed.json 与 Mod 文件启停都是「读取 → 修改 → 写回」模式：
// 安装任务、启用/禁用、卸载、启动前修复之间如果交错执行，会丢失更新。
// 最典型的后果是安装任务用旧快照把「刚被卸载的 Mod 记录」写回去，变成幽灵记录。
//
// 锁以 Profile 目录为资源名，粒度只覆盖状态读改写（毫秒级），
// 不覆盖下载与解压本身，避免长时间独占导致用户操作被卡住。
const tails = new Map();

function lockKey(profileDir) {
  return path.resolve(String(profileDir || '')).toLowerCase();
}

/**
 * 在 Profile 锁内执行任务，返回任务本身的 Promise。
 * 同一个 profileDir 的任务按调用顺序串行；前序失败不会影响后续任务。
 */
function withProfileLock(profileDir, task) {
  const key = lockKey(profileDir);
  const previous = tails.get(key) || Promise.resolve();
  const run = previous.then(
    () => task(),
    () => task()
  );
  // 链上只保留「已结束」的哨兵，任务成功/失败都不让异常在链上传播
  const tail = run.then(
    () => undefined,
    () => undefined
  );
  tails.set(key, tail);
  tail.then(() => {
    if (tails.get(key) === tail) tails.delete(key);
  });
  return run;
}

module.exports = { withProfileLock };
