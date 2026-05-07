import en from './dictionaries/en.json'
import si from './dictionaries/si.json'
import ta from './dictionaries/ta.json'

export const dictionaries: Record<string, any> = {
  en: en,
  si: si,
  ta: ta,
}

export const getDictionary = async (locale: string) => {
  return dictionaries[locale] || dictionaries['en']
}
