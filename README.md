# Zotero Reference

[![Latest release](https://img.shields.io/github/v/release/MuiseDestiny/zotero-reference)](https://github.com/MuiseDestiny/zotero-reference/releases)
![Release Date](https://img.shields.io/github/release-date/MuiseDestiny/zotero-reference?color=9cf)
[![License](https://img.shields.io/github/license/MuiseDestiny/zotero-reference)](https://github.com/MuiseDestiny/zotero-reference/blob/master/LICENSE)
![Downloads latest release](https://img.shields.io/github/downloads/MuiseDestiny/zotero-reference/latest/total?color=yellow)

> 为Zotero扩展`参考文献`侧边栏，让`关联文献`不再孤单

📖 侧边栏快速检索，点击参考文献右侧`+`可将其与正在阅读文献双向关联，`-`号与`关联文献`里的`-`号效果一致，会将关联移除。

👻 首次打开本地PDF解析参考文献，失败或点击`刷新`按钮会使用API解析。

![image](https://user-images.githubusercontent.com/51939531/208280890-582f40f4-8ea4-41dd-b09e-5ef1f077b8c4.png)

![image](https://user-images.githubusercontent.com/51939531/208114512-2b58ebcb-ca34-4187-93b2-d7f96b0ea4c2.png)

## 👋 使用
单击`参考文献` -> 复制此条参考文献信息；
ctrl+单击`参考文献` -> 用默认浏览器打开文献地址；

单击`+` -> 添加参考文献至`正在阅读文献`所在文件夹下并与之双向关联；
ctrl+单击`+` -> 添加参考文献至`当前所在文件夹`下并与之双向关联；

![image](https://user-images.githubusercontent.com/51939531/208303399-0dc09046-997c-4809-8639-9100001e6002.png)

如这里的GEE就是当前文件夹，可以在主界面点击要添加到的文件夹，然后回到阅读文献ctrl+单击`+`即可。

## 🌸 实现
配料：PDF文档内所有文字 + `unpaywall api` + `crossref api` + `茉莉花插件` + `知网`

具体做法如下：

- 第一步，打开PDF，从最后一页开始获取页面所有文字`getTextContent()`，它是一个`Array=[item1, item2, ...]`每个item包含(x, y)坐标以及宽高，当然也包含文字；
- 第二步，合并相同高度的item；
- 第三步，判断所有item里是否包含`参考文献|Reference`截断词，不包含记录下来此次的Array，重复第一步，包含就合并所有Array，并把此次Array用包含截断词的item截断，扔掉item之前的，保留之后的；
- 第四步，以包含截断词页面为基准，校正其他页面item的x坐标；
- 第五步，将分栏参考文献变成一栏；
- 第六步，根据第一条参考文献的缩进，依次匹配每一条参考文献，当然缩进正确还要进行格式检查。比如是不是`[1] xxx`的形式；
- 第七步，把解析到的参考文献添加到侧边栏；
- 第八步，解析失败？中文去知网爬（借助`茉莉花`），英文去`crossref api`获取；
- 第九步，用户点击一个条目的`+`时候，立即判断点击条目的标题和作者，是否有`DOI`？是否是中文的`标题`？是否可以根据英文标题查询到`DOI`？这都是一个优秀的厨师需要考虑的。

## 🕊️ TODO
- [ ] 根据反馈，是否需要在主界面（非阅读状态）添加`参考文献`到侧边栏，目前仅阅读状态下添加
- [ ] 是否需要全部导入，或多选导入功能
- [x] 是否需要中文支持，如果需要请提供网站或参考文献获取方案（已支持知网）
- [ ] 是否需要针对特定期刊改变参考文献获取策略
- [ ] 根据条目类型改变参考文献条目图标

## 👋 说明

1. 本插件的自动关联功能与`scihub`插件不兼容

![未命名文件-导出 (3)](https://user-images.githubusercontent.com/51939531/208129588-e26ff970-7412-4c3f-9c1c-405514b10509.png)

## 🍭 致谢

本插件基于模板：

- [zotero-addon-template](https://github.com/windingwind/zotero-addon-template)

本插件部分功能基于插件:

- [茉莉花/jasminum](https://github.com/l0o0/jasminum)

代码参考：

- [zotero-pdf-translate](https://github.com/windingwind/zotero-pdf-translate)
- [chartero](https://github.com/volatile-static/Chartero)

API：
- [unpaywall](https://api.unpaywall.org/)
- [crossref](https://github.com/CrossRef/rest-api-doc)
