const { Sequelize, Model, DataTypes } = require("sequelize");
const fs = require("fs");
const readline = require("readline");

// 连接数据库
const sequelize = new Sequelize("ashtree", "root", "a123456789", {
  host: "localhost",
  dialect: "mysql",
});

class Word extends Model {}

Word.init(
  {
    word_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    word_head: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: "词头",
    },
    word_key: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: "唯一键",
    },
    usphone: {
      type: DataTypes.STRING(32),
      defaultValue: null,
      comment: "美音音标",
    },
    ukphone: {
      type: DataTypes.STRING(32),
      defaultValue: null,
      comment: "英音音标",
    },
    book_key: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    tran_cn: {
      type: DataTypes.STRING(128),
      defaultValue: null,
      comment: "中文释义",
    },
    tran_en: {
      type: DataTypes.STRING(128),
      defaultValue: null,
      comment: "英英释义",
    },
    pos: {
      type: DataTypes.STRING(8),
      defaultValue: null,
      comment: "词性",
    },
  },
  {
    sequelize, // 传入 Sequelize 实例
    modelName: "Word", // 模型名称
    tableName: "word", // 表名，确保与数据库中的表名匹配
    timestamps: false, // 禁用 Sequelize 的自动时间戳，因为我们已经定义了自己的时间戳字段
  }
);

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
  await sequelize.sync(); // 确保表存在
  const content = originWord.content.word.content;
  console.log("content:", content);
  const snakeCaseWordKey = originWord.headWord
    .toLowerCase()
    .replace(/\s+/g, "_");
  try {
    await Word.create({
      word_head: originWord.headWord,
      word_key: snakeCaseWordKey,
      usphone: content.usphone,
      ukphone: content.ukphone,
      book_key: "cet4",
      tran_cn: content.trans[0].tranCn,
      tran_en: content.trans[0].tranOther,
      pos: content.trans[0].pos,
    });
  } catch (error) {}

  await sequelize.close(); // 关闭连接
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

processLineByLine("../book/CET4luan_1.json");

// insertData();
