# Marriage-Or-Divorce Sort

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-2.1.0-green.svg)
[![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-yellow.svg)](https://snowfallinghere.github.io/marriageORdivorceSort/)

> 一个基于"婚姻配对"概念的可视化排序算法，通过模拟配对、争吵、出轨、离婚等过程实现数据排序。

## 📖 算法简介

Marriage-Or-Divorce Sort 是一个独特的排序算法，它模拟现实生活中的婚姻关系动态：

- **配对（Marriage）**：人们两两配对组建家庭
- **争吵（Quarrel）**：部分配对会发生争吵，降低关系稳定性
- **出轨（Cheating）**：较小的一方可能寻找更大的伴侣
- **离婚（Divorce）**：关系破裂后重新回到匹配池

通过这些动态过程，数据最终会呈现有序排列。

## 🎯 核心规则

### 目标
让所有配对的数值按大小有序排列（从小到大或从大到小）。

### 状态说明

| 状态 | 颜色 | 说明 |
|------|------|------|
| 单身 (Single) | 灰色 | 未参与配对 |
| 已婚 (Married) | 红色渐变 | 正常配对中 |
| 等待配对 (Wait) | 黄色渐变 | 在匹配池中等待 |
| 争吵中 (Quarrel) | 深红色 | 关系紧张，冷静期 |
| 出轨 (Cheating) | 紫色渐变 | 正在寻找新伴侣 |

### 算法常量

| 常量 | 默认值 | 说明 |
|------|--------|------|
| PAIR_SUCCESS_RATE | 0.8 | 配对成功率 |
| CHEATING_OUTSIDE_RATE | 0.6 | 出轨成功率 |
| DATING_SUCCESS_RATE | 0.5 | 约会成功率 |
| QUARREL_RATE | 0.6 | 争吵概率 |
| DIVORCE_TREND_INCREMENT | 20 | 每次争吵增加的离婚倾向 |
| DIVORCE_NATURAL_GROWTH | 5 | 每回合自然增长的离婚倾向 |
| PAIR_BAN_ROUNDS | 12 | 离婚后禁止配对回合数 |
| QUARREL_WAIT_ROUNDS | 2 | 争吵冷静期回合数 |

## 🎮 操作说明

### 控制面板

- **Start**：开始算法
- **Pause/Resume**：暂停/继续
- **Reset**：重新开始
- **Data Count**：设置数据个数（2-20）
- **Speed**：设置每回合速度（毫秒）

### 🎰 竞猜功能

开启竞猜模式，为某个数值投注，看看它能否坚持到排序结束成为"最终配对"！

- **启用竞猜**：勾选"是否竞猜"复选框启用
- **竞猜流程**：
  1. 排序开始前，输入你要投注的数值
  2. 点击"确认竞猜"按钮确认你的投注
  3. 排序过程中可暂停，最多有**两次机会**在暂停时调整竞猜数值
  4. 排序结束后，检查你的竞猜是否成功
- **成功条件**：你投注的数值最终必须在已婚配对中存活
- **提示**：鼠标悬停在柱状条上可查看该值的婚姻稳定加权数

### 帮助信息

点击右上角的 `?` 图标查看详细的算法说明。

## 🚀 快速开始

### 直接打开

直接在浏览器中打开 `index.html` 文件即可使用。

```bash
# 或者使用本地服务器
python -m http.server 8000
# 然后访问 http://localhost:8000
```

### 参数配置

```javascript
// 在代码中修改常量
const CONSTANTS = {
    PAIR_SUCCESS_RATE: 0.8,
    CHEATING_OUTSIDE_RATE: 0.6,
    DATING_SUCCESS_RATE: 0.5,
    QUARREL_RATE: 0.6,
    DIVORCE_TREND_INCREMENT: 20,
    DIVORCE_NATURAL_GROWTH: 5,
    DIVORCE_THRESHOLD: 100,
    PAIR_BAN_ROUNDS: 12,
    QUARREL_WAIT_ROUNDS: 2,
    PAIR_CHECK_ROUNDS: 4,
    PAIR_LIMIT: 2,
    MIN_VALUE: 1,
    MAX_VALUE: 100,
    MIN_DATA_COUNT: 2,
    MAX_DATA_COUNT: 20,
    DEFAULT_DATA_COUNT: 12,
    DEFAULT_SPEED: 1000,
    MIN_SPEED: 100,
    MAX_SPEED: 5000,
};
```

## 🔧 API 参考

### MarriageOrDivorceSort 类

#### 构造函数

```javascript
const sorter = new MarriageOrDivorceSort();
```

#### 方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `generateData(count, minVal, maxVal)` | 生成指定数量的不重复随机数据 | `Person[]` |
| `step()` | 执行一回合算法 | `Object` |
| `sortSucceeded` | 排序是否成功 | `boolean` |
| `roundNumber` | 当前回合数 | `number` |

#### 返回对象结构

```javascript
{
    round: 1,                           // 当前回合
    eliminated: [{id, value}],         // 被淘汰的人
    married: [[{id, value, status}]],   // 已婚配对
    pool: [{id, value}],               // 匹配池
    sortSucceeded: false,              // 是否排序成功
    newEvents: ['event'],              // 新发生的事件
    allEvents: ['event']               // 所有事件
}
```

### Person 类

```javascript
class Person {
    value;              // 数值
    id;                // 唯一标识符
    status;            // 当前状态
    partner;           // 当前伴侣
    divorceTrend;      // 离婚倾向 (0-100)
    pairHistory;       // 配对历史
    bannedWith;        // 禁止配对的对象
    quarrelWaitRounds; // 争吵等待回合数
    divorcedThisRound; // 本回合是否刚离婚
    justPaired;        // 本回合是否刚配对
}
```

## 📊 排序流程

```
┌─────────────────────────────────────┐
│         初始化/重置                  │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│      第一回合：直接两两配对           │
│   (奇数则踢掉最小的到匹配池)          │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│         检查排序是否成功              │
└──────────────┬──────────────────────┘
               ▼
    ┌──────────┴──────────┐
    │     排序成功?        │
    └──────────┬──────────┘
          Yes │ No
              ▼
┌─────────────────────────────────────┐
│         后续回合处理                 │
│  1. 匹配池配对                       │
│  2. 出轨处理                         │
│  3. 离婚倾向处理                     │
│  4. 主表格修复                       │
└──────────────┬──────────────────────┘
               ▼
        返回继续循环
```

## 🎨 界面说明

### 主显示区域

- **图表区域**：显示已婚配对，每个配对有两个柱子并排显示
- **虚线框**：配对成功的两人会被虚线框包围
- **颜色编码**：不同状态对应不同颜色

### 统计面板

- 当前回合数
- 已婚配对数量
- 匹配池人数
- 被淘汰人数

### 事件日志

实时显示算法运行过程中的所有事件，带有时间戳。

## 🐛 已知问题

1. 数据量较大时（>20），算法可能需要较长时间完成
2. 某些极端情况下可能出现死循环（已添加超时保护）

## 📝 更新日志

### v2.1.0
- 添加竞猜功能，排序前可对数值进行投注
- 支持两次调整机会（暂停时可修改）
- 添加竞猜结果统计

### v2.0.0
- 完全重构代码，遵循 ES6+ 规范
- 添加详细中英文注释
- 统一常量管理
- 优化 DOM 操作性能
- 添加分层动画
- 添加输入校验
- 添加成功提示音
- 修复排序校验逻辑
- 修复禁止配对冗余问题

### v1.0.0
- 初始版本
- 基本排序功能
- 可视化界面

## 📄 License

MIT License

## 👨‍💻 作者

SnowFallingHere

## 🙏 致谢

- 灵感来源于现实生活中的婚姻关系动态
- 排序算法受到冒泡排序的启发
