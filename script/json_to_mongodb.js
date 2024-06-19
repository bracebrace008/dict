const fs = require("fs");
const readline = require("readline");

// 连接数据库

const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/ashtree", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const wordSchema = new mongoose.Schema(
  {
    sort: { type: Number, default: 0 }, // 排序
    wordHead: { type: String, required: true, maxlength: 64, index: true }, // 词头
    usphone: { type: String, maxlength: 128, default: null }, // 美音音标
    ukphone: { type: String, maxlength: 128, default: null }, // 英音音标
    phone: { type: String, maxlength: 128, default: null }, // 音标
    bookKey: { type: String, required: true, maxlength: 32, index: true }, // 所属的bookId
    trans: [
      {
        tranCn: String, // 中文释义
        tranOther: String, // 英英释义
        pos: { type: String, maxlength: 32, default: null }, // 词性
      },
    ],
    sentences: [
      {
        sContent: String,
        sCn: String,
      },
    ],
  },
  { timestamps: true }
);

const WordModel = mongoose.model("word", wordSchema);

const replacements = {
  é: "e",
  ê: "e",
  è: "e",
  ë: "e",
  à: "a",
  â: "a",
  ç: "c",
  î: "i",
  ï: "i",
  ô: "o",
  ù: "u",
  û: "u",
  ü: "u",
  ÿ: "y",
};

function replaceCharacters(text) {
  // 使用正则表达式和 replace 方法来替换所有定义的字符
  return Object.keys(replacements).reduce((acc, key) => {
    // 创建一个正则表达式来匹配当前字符，并设置为全局匹配
    const regex = new RegExp(key, "g");
    // 替换当前字符
    return acc.replace(regex, replacements[key]);
  }, text);
}

// 插入数据
async function insertData(originWord) {
  const bookKey = "CET4luan_2";
  const content = originWord.content.word.content;
  try {
    let word = await WordModel.findOne({
      wordHead: originWord.headWord,
      bookKey,
    });
    if (word) {
      // console.log(`${originWord.headWord} 已存在`);
      return;
    }
    word = new WordModel();
    word.sort = originWord.wordRank;
    word.wordHead = originWord.headWord;
    word.usphone = content.usphone;
    word.ukphone = content.ukphone;
    word.bookKey = bookKey;
    word.trans = content.trans;
    word.phone = content.phone;
    word.sentences = content?.sentence?.sentences;
    await word.save();
    console.log("insert word:", word);
  } catch (error) {
    console.log("insertData error:", error);
  }
}

async function processLineByLine(filePath) {
  try {
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity, // \r\n 和 \n 都支持作为行结束符
    });

    // 为了使用 async/await，我们将监听每一行的读取
    for await (const line of rl) {
      try {
        const originWord = JSON.parse(replaceCharacters(line));
        insertData(originWord);
      } catch (error) {
        console.log("error:", error);
      }
    }

    console.log("File has been read.");
  } catch (err) {
    console.error(err);
  }
}

processLineByLine("../book/CET4luan_2.json");

// insertData();
