# vue-analysis
Vue源码注释版 及 Vue源码详细解析

本项目介绍的源码版本是当前(17年2月23日)1.x版本的最新版v1.0.26，2.x版本的源码会在之后更新。

## Vue源码详细解析

Vue源码详细解析教程包含了Vue中从数据observe到模板解析、transclude、compile、link、指令的bind、update、dom批处理更新、数组diff等等环节，基本涵盖了Vue整个生命周期过程。订阅新文章请watch本项目。

### 文章 **主线剧情**
* [Vue源码详细解析(一)--数据的响应化](https://github.com/Ma63d/vue-analysis/issues/1)

  主要介绍了Vue如何实现数据的相应化，以及面对getter/setter无法监听属性删除、添加的缺点，Vue是如何弥补。
* [Vue源码详细解析(二)-- _compile函数的整体介绍与transclude分析](https://github.com/Ma63d/vue-analysis/issues/2)
  介绍Vue如何将HTML模板转化为真正的dom。
* [Vue源码详细解析(三)--compile函数：指令的提取](https://github.com/Ma63d/vue-analysis/issues/3)
  详细阐述指令提取与解析插值模板的过程。
* [Vue源码详细解析(四)--link函数](https://github.com/Ma63d/vue-analysis/issues/4)
  结合具体的指令分析其构建、bind、update过程，并阐述了依赖订阅、退订和表达式如何解析为对应get函数相关内容。
* [Vue源码详细解析(五)--batcher：数据变动后的批处理更新dom](https://github.com/Ma63d/vue-analysis/issues/5)

### 文章 **支线剧情**
*阅读之前,请先阅读完主线剧情的内容,我在书写时也默认您已经看完主线系列文章,不会再细说Vue核心部分的内容.*

* [Vue源码详解之nextTick：MutationObserver只是浮云，microtask才是核心！](https://github.com/Ma63d/vue-analysis/issues/6)
* [Vue源码详解之v-for](https://github.com/Ma63d/vue-analysis/issues/7)

### 正在书写

- [ ] Vue源码详细解析--计算属性与lazy watcher
- [ ] Vue源码详细解析--`_digest`方法与shallow update

## [Vue源码注释版](https://github.com/Ma63d/vue-analysis/tree/master/vue%E6%BA%90%E7%A0%81%E6%B3%A8%E9%87%8A%E7%89%88)

[源码注释版](https://github.com/Ma63d/vue-analysis/tree/master/vue%E6%BA%90%E7%A0%81%E6%B3%A8%E9%87%8A%E7%89%88)比文章要更加详细，对于看源码的同学，应该能帮到你。

虽然Vue本身的英文注释已经足够详尽，但依然有许多对于初看源码的同学而言比较难以理解的部分。主要是Vue实现的功能较多，因此，许多代码不知道其目的所在。因此我尽量注释了一些让人困惑的部分。对于许多已经很清晰的代码，如util部分、event部分，则基本没有涉及。

目前注释版依然有许多空缺，比如繁多的Vue指令部分。欢迎大家随时提PR。





