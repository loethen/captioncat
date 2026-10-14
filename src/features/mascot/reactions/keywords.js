// Caption keywords for each expression, grouped by language. Captions are lower-cased before
// matching. Languages written with spaces match whole words only; Chinese, Japanese and Korean
// (see UNSPACED) match anywhere in the caption, so keep those entries specific enough not to
// fire inside unrelated words.
export const UNSPACED = ['zh', 'ja', 'ko'];

export const keywords = {
  happy: {
    en: ['[music]', '[applause]', '[laughter]', '[laughs]', '[cheering]', 'lol', 'thank you', 'thanks'],
    zh: ['哈哈', '谢谢', '謝謝', '感谢', '感謝', '太好了', '开心', '開心', '高兴', '高興'],
    ja: ['ありがとう', '嬉しい', 'うれしい', 'やった', '楽しい'],
    ko: ['감사합니다', '고마워', '하하', 'ㅋㅋ', '행복'],
    es: ['[música]', '[aplausos]', '[risas]', 'gracias', 'feliz'],
    fr: ['[musique]', '[applaudissements]', '[rires]', 'merci', 'génial'],
    de: ['[musik]', '[applaus]', '[lachen]', 'danke'],
    pt: ['[música]', '[aplausos]', '[risos]', 'obrigado', 'obrigada'],
    ru: ['[музыка]', '[аплодисменты]', '[смех]', 'спасибо', 'ура'],
  },
  love: {
    en: ['love', 'loved', 'adorable', 'cute', 'beautiful', 'favorite'],
    zh: ['爱你', '愛你', '喜欢', '喜歡', '可爱', '可愛', '好美', '漂亮', '最爱', '最愛'],
    ja: ['好き', 'かわいい', '可愛い', '愛してる', 'きれい'],
    ko: ['사랑', '귀여워', '예뻐', '좋아해'],
    es: ['amor', 'te quiero', 'te amo', 'lindo', 'linda', 'precioso', 'preciosa', 'hermoso', 'hermosa'],
    fr: ['amour', "je t'aime", 'mignon', 'mignonne', 'magnifique', 'adore'],
    de: ['liebe', 'süß', 'wunderschön'],
    pt: ['amor', 'te amo', 'lindo', 'linda', 'fofo', 'fofa'],
    ru: ['люблю', 'любовь', 'милый', 'милая', 'красиво'],
  },
  food: {
    en: ['eat', 'eating', 'ate', 'hungry', 'delicious', 'yummy', 'snack', 'lunch', 'dinner', 'breakfast', 'food', 'fish', 'tuna', 'milk', 'chicken', 'meat', 'treat', 'treats'],
    zh: ['好吃', '美味', '饿了', '餓了', '早餐', '午饭', '午飯', '晚饭', '晚飯', '吃饭', '吃飯', '零食', '小鱼干', '小魚乾'],
    ja: ['美味しい', 'おいしい', 'お腹すいた', 'ご飯', 'ごはん', 'いただきます'],
    ko: ['맛있', '배고파', '먹자', '간식'],
    es: ['comer', 'comida', 'hambre', 'delicioso', 'deliciosa', 'desayuno', 'almuerzo', 'cena', 'pescado', 'pollo', 'leche'],
    fr: ['manger', 'faim', 'délicieux', 'délicieuse', 'repas', 'déjeuner', 'dîner', 'poisson', 'poulet', 'lait'],
    de: ['essen', 'hunger', 'hungrig', 'lecker', 'frühstück', 'mittagessen', 'abendessen', 'fisch', 'milch'],
    pt: ['comer', 'comida', 'fome', 'delicioso', 'deliciosa', 'almoço', 'jantar', 'peixe', 'frango', 'leite'],
    ru: ['еда', 'голоден', 'голодна', 'вкусно', 'завтрак', 'обед', 'ужин', 'рыба', 'молоко'],
  },
  sleepy: {
    en: ['sleep', 'sleepy', 'tired', 'bed', 'yawn', 'boring', 'exhausted'],
    zh: ['困了', '好困', '睡觉', '睡覺', '晚安', '累了', '好累', '无聊', '無聊'],
    ja: ['眠い', 'ねむい', 'おやすみ', '疲れた', '退屈'],
    ko: ['졸려', '피곤', '잘자'],
    es: ['sueño', 'dormir', 'cansado', 'cansada', 'aburrido', 'buenas noches'],
    fr: ['sommeil', 'dormir', 'fatigué', 'fatiguée', 'ennuyeux', 'bonne nuit'],
    de: ['müde', 'schlafen', 'langweilig', 'gute nacht'],
    pt: ['sono', 'dormir', 'cansado', 'cansada', 'boa noite'],
    ru: ['спать', 'устал', 'устала', 'скучно', 'спокойной ночи'],
  },
  ask: {
    zh: ['为什么', '為什麼', '怎么回事', '怎麼回事', '真的吗', '真的嗎'],
    ja: ['なんで', 'どうして', '本当に'],
    ko: ['왜요', '진짜요', '뭐야'],
    es: ['por qué', 'de verdad'],
    fr: ['pourquoi', 'vraiment'],
    de: ['warum', 'wieso', 'wirklich'],
    pt: ['por que', 'porquê', 'sério'],
    ru: ['почему', 'зачем', 'правда'],
  },
  wow: {
    en: ['wow', 'whoa', 'omg', 'oh my god', 'no way', 'amazing', 'incredible'],
    zh: ['哇', '天哪', '天啊', '我的天', '不会吧', '不會吧', '厉害', '厲害'],
    ja: ['すごい', 'すげー', 'まじで', 'マジで', 'うそ'],
    ko: ['대박', '헐', '세상에'],
    es: ['guau', 'increíble', 'dios mío', 'no puede ser'],
    fr: ['incroyable', 'mon dieu', 'waouh'],
    de: ['wahnsinn', 'unglaublich', 'krass', 'oh mein gott'],
    pt: ['uau', 'incrível', 'meu deus', 'nossa'],
    ru: ['вау', 'ого', 'невероятно', 'офигеть'],
  },
};
