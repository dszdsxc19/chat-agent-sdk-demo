/**
 * 核心：Duck Typing 校验器
 * 不依赖具体 class，只看行为
 */
export function isZodLike(schema: any): boolean {
  return (
    schema !== null &&
    typeof schema === 'object' &&
    typeof schema.parse === 'function' &&      // 核心特征：能解析
    typeof schema.safeParse === 'function'     // 核心特征：能安全解析
    // 可选：检查 schema._def 属性，但这属于 Zod 内部实现，根据需要决定是否检查
  );
}
