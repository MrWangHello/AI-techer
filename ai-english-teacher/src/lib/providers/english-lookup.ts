/**
 * 兼容旧导入：查词已迁到 local-dictionary（零网络）
 */
export {
  extractChineseQuery,
  looksLikeChineseLookup,
  lookupDictionaryLocal as tryChineseToEnglishLookup,
} from "./local-dictionary";
