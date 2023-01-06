import Addon from "./addon";
import Locale from "./locale";
import AddonModule from "./module";
import { log } from "../../zotero-plugin-toolkit/dist/utils";
import {ItemBaseInfo, ItemInfo, Reference} from "./types"
import { url } from "inspector";
const lang = Services.locale.getRequestedLocale().split("-")[0];

class AddonViews extends AddonModule {
  private progressWindowIcon: object;
  private progressWindow: any;
  public tabpanel: XUL.Element;
  public reader: _ZoteroReaderInstance;
  public tipTimer: number | null;
  public iconStyles: object;
  constructor(parent: Addon) {
    console.log("AddonViews constructor")
    super(parent);
    this.progressWindowIcon = {
      success: "chrome://zotero/skin/tick.png",
      fail: "chrome://zotero/skin/cross.png",
      default: `chrome://${this.Addon.addonRef}/skin/favicon.png`,
    };
    this.iconStyles = {
      bacogroundColor: "none",
      backgroundSize: "16px 16px",
      backgroundRepeat: "no-repeat",
      backgroundPositionX: "center",
      backgroundPositionY: "center",
      backgroundClip: "border-box",
      backgroundOrigin: "padding-box",
      width: "16px",
      "margin-inline-start": "0px",
      "margin-inline-end": "0px",
      marginTop: "0px",
      marginBottom: "0px",
    }
  } 

  public initViews() {
    let reader = this.Addon.utils.getReader()
    if (!reader) { return }
    this.buildTabPanel(this.getTabContainer())
  }

  public async updateReferenceUI(reader: _ZoteroReaderInstance) {
    log("updateReferenceUI is called")
    await Zotero.uiReadyPromise;
    // addon is disabled
    if (!Zotero.ZoteroReference) {
      return this.removeUI()
    }
    
    if (!reader) { return false }
    this.reader = reader

    const item = this.Addon.utils.getItem()
    log("reading -> ", item.getField("title"));
    await reader._waitForReader();
    let tabContainer = this.getTabContainer()
    if (!(tabContainer && tabContainer.querySelector("#zotero-reference-tab"))) {
      // build
      const tabpanel = await this.buildTabPanel(tabContainer);
      // then
      if (this.Addon.prefs.get("autoRefresh") === true) {
        this.autoRefresh(tabpanel)
      }
    }
    if (this.Addon.prefs.get("modifyLinks")) {
      this.modifyLinks(reader)
    }
    if (this.Addon.prefs.get("loadingRelated")) {
      await this.loadingRelated(tabContainer);
    }
  }

  // using tookit
  // public initViews() {
  //   this.Addon.toolkit.Tool.log("Initializing UI");
  //   const readerTabId = "zotero-reference"
  //   this.Addon.toolkit.UI.registerReaderTabPanel(
  //     Locale[lang].tabLabel,
  //     async (panel: any, deck: XUL.Deck, window: Window, reader: _ZoteroReaderInstance) => {
  //       if (!panel) {
  //         this.Addon.toolkit.Tool.log(
  //           "This reader do not have right-side bar. Adding reader tab skipped."
  //         );
  //         return;
  //       }
  //       const relatedbox = this.Addon.toolkit.UI.creatElementsFromJSON(
  //         window.document,
  //         {
  //           tag: "relatedbox",
  //           id: `${this.Addon.addonRef}-${reader._instanceID}-extra-reader-tab-div`,
  //           classList: ["zotero-editpane-related"],
  //           namespace: "xul",
  //           removeIfExists: true,
  //           ignoreIfExists: true,
  //           attributes: {
  //             flex: "1",
  //           },
  //           subElementOptions: [
  //             {
  //               tag: "vbox",
  //               namespace: "xul",
  //               classList: ["zotero-box"],
  //               attributes: {
  //                 flex: "1",
  //               },
  //               styles: {
  //                 paddingLeft: "0px",
  //                 paddingRight: "0px"
  //               },
  //               subElementOptions: [
  //                 {
  //                   tag: "hbox",
  //                   namespace: "xul",
  //                   attributes: {
  //                     align: "center"
  //                   },
  //                   subElementOptions: [
  //                     {
  //                       tag: "label",
  //                       namespace: "xul",
  //                       id: "referenceNum",
  //                       attributes: {
  //                         value: `0 ${Locale[lang].referenceNumLabel}`
  //                       },
  //                       listeners: [
  //                         {
  //                           type: "dblclick",
  //                           listener: () => {
  //                             console.log("Copy all references")
  //                             let textArray = []
  //                             let labels = relatedbox.querySelectorAll("rows row box label")
  //                             labels.forEach((e: XUL.Label) => {
  //                               textArray.push(e.value)
  //                             })
  //                             this.showProgressWindow("Reference", "Copy all references", "success")
  //                             this.Addon.toolkit.Tool.getCopyHelper()
  //                               .addText(textArray.join("\n"), "text/unicode")
  //                               .copy();
  //                           }
  //                         }
  //                       ]
  //                     },
  //                     {
  //                       tag: "button",
  //                       namespace: "xul",
  //                       id: "refreshButton",
  //                       attributes: {
  //                         label: Locale[lang].refreshButtonLabel
  //                       },
  //                       listeners: [
  //                         {
  //                           type: "click",
  //                           listener: async () => {
  //                             await this.refreshReferences(panel)
  //                           }
  //                         }
  //                       ]
  //                     }
  //                   ]
  //                 },
  //                 {
  //                   tag: "grid",
  //                   namespace: "xul",
  //                   attributes: {
  //                     flex: "1"
  //                   },
  //                   subElementOptions: [
  //                     {
  //                       tag: "columns",
  //                       namespace: "xul",
  //                       subElementOptions: [
  //                         {
  //                           tag: "column",
  //                           namespace: "xul",
  //                           attributes: {
  //                             flex: "1"
  //                           }
  //                         },
  //                         {
  //                           tag: "column",
  //                           namespace: "xul",
  //                         },
  //                       ]
  //                     },
  //                     {
  //                       tag: "rows",
  //                       namespace: "xul",
  //                       id: "referenceRows"
  //                     }
  //                   ]
  //                 }
  //               ]
  //             }
  //           ]
  //         }
  //       );
  //       panel.append(relatedbox);
  //       // after build UI
  //       if (Zotero.Prefs.get(`${this.Addon.addonRef}.autoRefresh`) === true) {
  //         let _notAutoRefreshItemTypes = Zotero.Prefs.get(`${this.Addon.addonRef}.notAutoRefreshItemTypes`) as string
  //         let notAutoRefreshItemTypes = _notAutoRefreshItemTypes.split(/,\s*/g)
  //         console.log(_notAutoRefreshItemTypes, notAutoRefreshItemTypes)
  //         const isExclude = notAutoRefreshItemTypes
  //           .indexOf(
  //             Zotero.ItemTypes.getName(
  //               this.Addon.utils.getItem().getField("itemTypeID")
  //             )
  //           ) != -1
  //         if (!isExclude) {
  //           this.refreshReferences(panel)
  //         }
  //       }
  //     },
  //     {
  //       targetIndex: 3,
  //       tabId: readerTabId,
  //     }
  //   )
  // }

  // public async updateReferencePanel(reader: _ZoteroReaderInstance) {
  //   console.log("updateReferencePanel")
  //   await Zotero.uiReadyPromise;
  //   if (!Zotero.ZoteroReference) {
  //     return this.removeTabPanel()
  //   }
  //   if (!reader) { return false }
  //   this.reader = reader
  //   if (Zotero.Prefs.get(`${this.Addon.addonRef}.openRelatedRecommaend`)) {
  //     await this.loadingRelated();
  //   }
  //   if (Zotero.Prefs.get(`${this.Addon.addonRef}.modifyLinks`)) {
  //     this.modifyLinks(reader)
  //   }
  // }

  public autoRefresh(tabpanel) {
    let _notAutoRefreshItemTypes = this.Addon.prefs.get("notAutoRefreshItemTypes") as string
    let notAutoRefreshItemTypes = _notAutoRefreshItemTypes.split(/,\s*/g)
    log("notAutoRefreshItemTypes", notAutoRefreshItemTypes)
    const isNot = notAutoRefreshItemTypes
      .indexOf(
        Zotero.ItemTypes.getName(
          this.Addon.utils.getItem().getField("itemTypeID")
        )
      ) != -1
    if (!isNot) {
      this.refreshReferences(tabpanel)
    }
  }

  public modifyLinks(reader) {
    let id = window.setInterval(() => {
      try {
        String(reader._iframeWindow.wrappedJSObject.document)
      } catch {
        return window.clearInterval(id)
      }
      reader._iframeWindow.wrappedJSObject.document
        .querySelectorAll(".annotationLayer a[href^='#']:not([modify])").forEach(a => {
          let _a = a.cloneNode(true)
          _a.setAttribute("modify", "")
          a.parentNode.appendChild(_a)
          a.remove()
          _a.addEventListener("click", async (event) => {
            event.preventDefault()
            let href = _a.getAttribute("href")
            if (reader._iframeWindow.wrappedJSObject.secondViewIframeWindow == null) {
              await reader.menuCmd("splitHorizontally")
              while (
                !(
                  reader._iframeWindow.wrappedJSObject?.secondViewIframeWindow?.PDFViewerApplication?.pdfDocument
                )
              ) {
                await Zotero.Promise.delay(100)
              }
              await Zotero.Promise.delay(1000)
            }
            reader._iframeWindow.wrappedJSObject.secondViewIframeWindow.PDFViewerApplication
              .pdfViewer.linkService.goToDestination(unescape(href.slice(1)))
          })
        })
    }, 100)
  }

  public removeUI() {
    try {
      const tabContainer = document.querySelector(`#${Zotero_Tabs.selectedID}-context`);
      tabContainer.querySelector("#zotero-reference-tab").remove()
      tabContainer.querySelector("#zotero-reference-tabpanel").remove()
    } catch (e) { }
  }

  private getTabContainer() {
    let tabId = Zotero_Tabs.selectedID
    return document.querySelector(`#${tabId}-context`)
  }

  private buildTabPanel(tabContainer) {
    this.Addon.toolkit.Tool.log("buildTabPanel");
    let tabbox = tabContainer.querySelector("tabbox")
    const tabs = tabbox.querySelector("tabs") as HTMLElement;
    const tabpanels = tabbox.querySelector("tabpanels") as HTMLElement;
    // for tab
    const tab = this.Addon.toolkit.UI.creatElementsFromJSON(
      window.document,
      { 
        tag: "tab",
        namespace: "xul",
        id: "zotero-reference-tab",
        attributes: {
          label: Locale[lang].tabLabel
        }
      },
      
    )
    // for tabpanel
    const tabpanel = this.Addon.toolkit.UI.creatElementsFromJSON(
      window.document,
      {
        tag: "tabpanel",
        namespace: "xul",
        id: "zotero-reference-tabpanel",
        subElementOptions: [
          {
            tag: "relatedbox",
            classList: ["zotero-editpane-related"],
            namespace: "xul",
            removeIfExists: true,
            ignoreIfExists: true,
            attributes: {
              flex: "1",
            },
            subElementOptions: [
              {
                tag: "vbox",
                namespace: "xul",
                classList: ["zotero-box"],
                attributes: {
                  flex: "1",
                },
                styles: {
                  paddingLeft: "0px",
                  paddingRight: "0px"
                },
                subElementOptions: [
                  {
                    tag: "hbox",
                    namespace: "xul",
                    attributes: {
                      align: "center"
                    },
                    subElementOptions: [
                      {
                        tag: "label",
                        namespace: "xul",
                        id: "referenceNum",
                        attributes: {
                          value: `0 ${Locale[lang].referenceNumLabel}`
                        },
                        listeners: [
                          {
                            type: "dblclick",
                            listener: () => {
                              console.log("Copy all references")
                              let textArray = []
                              let labels = tabpanel.querySelectorAll("rows row box label")
                              labels.forEach((e: XUL.Label) => {
                                textArray.push(e.value)
                              })
                              this.showProgressWindow("Reference", "Copy all references", "success")
                              this.Addon.toolkit.Tool.getCopyHelper()
                                .addText(textArray.join("\n"), "text/unicode")
                                .copy();
                            }
                          }
                        ]
                      },
                      {
                        tag: "button",
                        namespace: "xul",
                        id: "refreshButton",
                        attributes: {
                          label: Locale[lang].refreshButtonLabel
                        },
                        listeners: [
                          {
                            type: "click",
                            listener: async () => {
                              await this.refreshReferences(tabpanel)
                            }
                          }
                        ]
                      }
                    ]
                  },
                  {
                    tag: "grid",
                    namespace: "xul",
                    attributes: {
                      flex: "1"
                    },
                    subElementOptions: [
                      {
                        tag: "columns",
                        namespace: "xul",
                        subElementOptions: [
                          {
                            tag: "column",
                            namespace: "xul",
                            attributes: {
                              flex: "1"
                            }
                          },
                          {
                            tag: "column",
                            namespace: "xul",
                          },
                        ]
                      },
                      {
                        tag: "rows",
                        namespace: "xul",
                        id: "referenceRows"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    );
    
    // insert
    this.insertAfter(tab, tabs.childNodes[2]);
    this.insertAfter(tabpanel, tabpanels.childNodes[2]);

    return tabpanel
  }

  /**
   * Only item with DOI is supported
   * @returns 
   */
  async loadingRelated(tabContainer) {
    log("loadingRelated");
    let item = this.Addon.utils.getItem()
    if (!item) { return }
    let itemDOI = item.getField("DOI")
    if (!itemDOI || !this.Addon.utils.isDOI(itemDOI)) {
      log("Not DOI", itemDOI);
      return
    }
    let relatedbox = tabContainer.querySelector("tabpanel:nth-child(3) relatedbox")
    do {
      await Zotero.Promise.delay(50);
    }
    while (!relatedbox.querySelector('#relatedRows'));

    let node = relatedbox.querySelector('#relatedRows').parentNode
    console.log("node", node)
    let relatedArray: ItemBaseInfo[] = await this.Addon.utils.API.getDOIRelatedArray(itemDOI)
    let func = relatedbox.refresh
    relatedbox.refresh = () => {
      func.call(relatedbox)
      this.refreshRelated(relatedArray, node)
      node.querySelectorAll("box image.zotero-box-icon")
        .forEach((e: XUL.Element) => {
          let label = this.Addon.toolkit.UI.creatElementsFromJSON(
            document,
            {
              tag: "label",
              namespace: "xul",
              styles: {
                backgroundImage: `url(${e.src})`,
                ...this.iconStyles
              }
            }
          )
          e.parentNode.replaceChild(label, e)
      })
    }
    relatedbox.refresh()
  }

  public refreshRelated(array: ItemBaseInfo[], node: XUL.Element) {
    let totalNum = 0
    log("refreshRelated", array)
    array.forEach((info: ItemBaseInfo) => {
      console.log(info)
      let DOI = info.identifiers.DOI
      let title = this.Addon.utils.Html2Text(info.title)
      let row = this.addRow(node, title, info, false, true)
      if (!row) { return }
      row.classList.add("only-title")
      totalNum += 1
      window.setTimeout(async () => {
        let item = await this.Addon.utils.searchItem("DOI", "is", DOI);
        if (!item) {
          (row.querySelector("box") as XUL.Element).style.opacity = ".5"
        }
      }, 0)
    })
    return totalNum
  }

  public async refreshReferences(tabpanel) {
    let source = tabpanel.getAttribute("source")
    if (source) {
      if (source == "PDF") {
        tabpanel.setAttribute("source", "API")
      }
      if (source == "API") {
        tabpanel.setAttribute("source", "PDF")
      }
    } else {
      tabpanel.setAttribute("source", this.Addon.prefs.get("prioritySource"))
    }

    // clear 
    tabpanel.querySelectorAll("#referenceRows row").forEach(e => e.remove());
    tabpanel.querySelectorAll("#zotero-reference-search").forEach(e => e.remove());

    let references: ItemBaseInfo[]
    let item = this.Addon.utils.getItem()
    let reader = this.Addon.utils.getReader()
    if (tabpanel.getAttribute("source") == "PDF") {
      references = await this.Addon.utils.PDF.getReferences(reader)
    } else {
      // 不再适配知网，没有DOI直接退出
      let DOI = item.getField("DOI")
      if (!this.Addon.utils.isDOI(DOI)) {
        this.showProgressWindow("Reference", `${DOI} is not DOI`, "fail")
        return
      }
      this.showProgressWindow("[Pending] Zotero Reference", "request references From API")
      references = (await this.Addon.utils.API.getDOIInfoByCrossref(DOI)).references
      this.showProgressWindow("[Done] Zotero Reference", `${ references.length } references`, "success")
    }

    const referenceNum = references.length
    let label = tabpanel.querySelector("label#referenceNum")
    references.forEach(async (reference: ItemBaseInfo, i: number) => {
      let refText = `[${i + 1}] ${reference.text}`
      this.addRow(tabpanel, refText, reference);
      label.value = `${Object.keys(reference).length}/${referenceNum} ${Locale[lang].referenceNumLabel}`;
    })
    label.value = `${referenceNum} ${Locale[lang].referenceNumLabel}`;
    log(
      JSON.parse(this.Addon.toolkit.Tool.getExtraField(item, "references"))
    )
  }

  public addSearch(node) {
    this.Addon.toolkit.Tool.log("addSearch")
    let textbox = document.createElement("textbox");
    textbox.setAttribute("id", "zotero-reference-search");
    textbox.setAttribute("type", "search");
    textbox.setAttribute("placeholder", Locale[lang].searchBoxTip)
    textbox.style.marginBottom = ".5em";
    textbox.addEventListener("input", (event: XUL.XULEvent) => {
      let text = (event.target as any).value
      this.Addon.toolkit.Tool.log(
        `ZoteroReference: source text modified to ${text}`
      );

      let keywords = text.split(/[ ,，]/).filter(e => e)
      if (keywords.length == 0) {
        node.querySelectorAll("row").forEach((row: XUL.Element) => row.style.display = "")
        return
      }
      node.querySelectorAll("row").forEach((row: XUL.Element) => {
        let content = (row.querySelector("label") as any).value
        let isAllMatched = true;
        for (let i = 0; i < keywords.length; i++) {
          isAllMatched = isAllMatched && content.toLowerCase().includes(keywords[i].toLowerCase())
        }
        if (!isAllMatched) {
          row.style.display = "none"
        } else {
          row.style.display = ""
        }
      })

    });
    textbox._clearSearch = () => {
      textbox.value = "";
      node.querySelectorAll("row").forEach((row: XUL.Element) => row.style.display = "")
    }
    node.querySelector("vbox").insertBefore(
      textbox,
      node.querySelector("vbox grid")
    )
  }

  private searchRelatedItem(item: _ZoteroItem, reference: ItemBaseInfo): _ZoteroItem {
    let relatedItems = item.relatedItems.map(key => Zotero.Items.getByLibraryAndKey(1, key))
    let relatedItem = relatedItems.find((item: _ZoteroItem) => {
      let flag = (
        reference.identifiers && (
          item.getField("DOI") == reference.identifiers.DOI ||
          item.getField("url").includes(reference.identifiers.arXiv)
        ) ||
        item.getField("title") == reference?.title
      )
      return flag
    })
    return relatedItem
  }

  public addRow(node: XUL.Element, refText: string, reference: ItemBaseInfo, addSearch: boolean = true, skipRelated: boolean = false) {
    // 避免重复添加
    if ([...node.querySelectorAll("row label")]
      .filter((e: XUL.Label) => e.value == refText)
      .length > 0) { return }
    // id描述
    let idText = (
      reference.identifiers
      && Object.values(reference.identifiers).length > 0
      && Object.keys(reference.identifiers)[0] + ": " + Object.values(reference.identifiers)[0]
    ) || "Reference"
    // 当前item
    let item = this.Addon.utils.getItem()
    let alreadyRelated = this.searchRelatedItem(item, reference)
    // TODO 可以设置
    let editTimer: number
    const row = this.Addon.toolkit.UI.creatElementsFromJSON(
      document,
      {
        tag: "row",
        namespace: "xul",
        subElementOptions: [
          {
            tag: "box",
            id: "reference-box",
            namespace: "xul",
            classList: ["zotero-clicky"],
            listeners: [
              {
                type: "click",
                listener: async (event: any) => {
                  event.preventDefault()
                  event.stopPropagation()
                  if (event.ctrlKey) {
                    console.log(reference)
                    let URL = reference.url
                    if (!URL) {
                      const refText = reference.text
                      let info: ItemBaseInfo = this.Addon.utils.refText2Info(refText)
                      this.showProgressWindow("[Pending] Request URL From API", refText)
                      if (this.Addon.utils.isChinese(refText)) {
                        URL = await this.Addon.utils.API.getCnkiURL(info.title, info.authors[0])
                      } else {
                        let DOI = await (await this.Addon.utils.API.getTitleInfoByCrossref(refText)).identifiers.DOI
                        URL = this.Addon.utils.identifiers2URL({ DOI })
                      }
                      this.showProgressWindow("[Done] Request URL From API", URL)
                    }
                    if (URL) {
                      this.showProgressWindow("Launching URL", URL)
                      Zotero.launchURL(URL);
                    }
                  } else {
                    if (editTimer) { return }
                    this.showProgressWindow(idText, reference.text, "default", 2500, -1)
                    this.Addon.toolkit.Tool.getCopyHelper()
                      .addText((idText ? idText + "\n" : "") + refText, "text/unicode")
                      .copy();
                  }
                }
              },
            ],
            subElementOptions: [
              {
                tag: "label",
                namespace: "xul",
                classList: [],
                styles: {
                  backgroundImage: `url(chrome://zotero/skin/treeitem-${reference.type}@2x.png)`,
                  ...this.iconStyles
                }
              },
              {
                tag: "label",
                namespace: "xul",
                id: "reference-label",
                classList: ["zotero-box-label"],
                attributes: {
                  value: refText,
                  crop: "end",
                  flex: "1"
                },
                listeners: [
                  {
                    type: "mousedown",
                    listener: () => {
                      editTimer = window.setTimeout(() => {
                        editLabel()
                      }, 500);
                    }
                  },
                  {
                    type: "mouseup",
                    listener: () => {
                      window.clearTimeout(editTimer)
                    }
                  }
                ]
              },
            ]
          },
          {
            tag: "label",
            id: "add-remove",
            namespace: "xul",
            attributes: {
              value: alreadyRelated ? "-" : "+"
            },
            classList: [
              "zotero-clicky",
              alreadyRelated ? "zotero-clicky-minus" : "zotero-clicky-plus"
            ]
          }
        ]
      }
    ) as XUL.Element
    
    let editLabel = () => {
      let box = row.querySelector("#reference-box") as XUL.Label
      let label = row.querySelector("#reference-label") as XUL.Label
      label.style.display = "none"
      let textbox = this.Addon.toolkit.UI.creatElementsFromJSON(
        document,
        {
          tag: "textbox",
          namespace: "xul",
          attributes: {
            value: label.value,
            flex: "1",
            multiline: "true",
            rows: "4"
          },
          listeners: [
            {
              type: "keyup",
              listener: () => {
                label.value = textbox.value
              }
            },
            {
              type: "blur",
              listener: () => {
                label.style.display = ""
                textbox.remove()
              }
            }
          ]
        }
      ) as XUL.Textbox
      textbox.focus()
      label.parentNode.insertBefore(textbox, label)
      
      let id = window.setInterval(() => {
        let active = rows.querySelector(".active")
        if (active && active != box) {
          label.style.display = ""
          textbox.remove()
          window.clearInterval(id)
        }
      }, 100)
    }

    const label = row.querySelector("label#add-remove") as XUL.Label
    let setState = (state: string = "") => {
      switch (state) {
        case "+":
          label.setAttribute("class", "zotero-clicky zotero-clicky-plus");
          label.setAttribute("value", "+");
          label.style.opacity = "1";
          break;
        case "-":
          label.setAttribute("class", "zotero-clicky zotero-clicky-minus");
          label.setAttribute("value", "-");
          label.style.opacity = "1";
          break
        case "":
          label.setAttribute("value", "");
          label.style.opacity = ".23";
          break
      }
    }

    let remove = async () => {
      log("removeRelatedItem")
      this.showProgressWindow("Removing", idText)
      setState()

      let relatedItem = this.searchRelatedItem(item, reference)
      if (!relatedItem) {
        this.showProgressWindow("Removed", idText)
        (node.querySelector("#refreshButton") as XUL.Button).click()
        return
      }
      relatedItem.removeRelatedItem(item)
      item.removeRelatedItem(relatedItem)
      await item.saveTx()
      await relatedItem.saveTx()

      setState("+")
      this.showProgressWindow("Removed", idText, "success")
    }

    let add = async (collections: undefined | number[] = undefined) => {
      // check DOI
      let refItem, source
      let info: ItemBaseInfo = this.Addon.utils.refText2Info(reference.text);
      setState()
      // 认为中文知网一定能解决
      if (this.Addon.utils.isChinese(info.title) && Zotero.Jasminum) {
        this.showProgressWindow("CNKI", info.title)
        // search DOI in local
        refItem = await this.Addon.utils.searchItem("title", "contains", info.title)

        if (refItem) {
          source = "Local Item"
        } else {
          refItem = await this.Addon.utils.createItemByJasminum(info.title, info.authors[0])
          source = "Created Item"
        }
        this.Addon.toolkit.Tool.log("addToCollection")
        for (let collectionID of (collections || item.getCollections())) {
          refItem.addToCollection(collectionID)
          await refItem.saveTx()
        }
      }
      // DOI or arXiv
      else {
        if (Object.keys(reference.identifiers).length == 0) {
          // 目前只能获取DOI
          this.showProgressWindow("[Pending] Request DOI From API", info.title)
          let DOI = await (await this.Addon.utils.API.getTitleInfoByCrossref(info.title)).identifiers.DOI
          if (!this.Addon.utils.isDOI(DOI)) {
            setState("+")
            this.showProgressWindow("[Fail] Request DOI From API", "Error DOI")
            return
          }
          this.showProgressWindow("[Done] Request DOI From API", DOI, "success")
          reference.identifiers = { DOI }
        }
        // done
        if (this.searchRelatedItem(item, reference)) {
          this.showProgressWindow("Added", JSON.stringify(reference.identifiers), "success");
          (node.querySelector("#refreshButton") as XUL.Button).click()
          return
        }
        this.showProgressWindow("Adding", JSON.stringify(reference.identifiers))
        setState()
        // search DOI in local
        refItem = await this.Addon.utils.searchItem("DOI", "is", JSON.stringify(reference.identifiers));
        if (refItem) {
          source = "Local Item"
          for (let collectionID of (collections || item.getCollections())) {
            refItem.addToCollection(collectionID)
            await refItem.saveTx()
          }
        } else {
          source = "Created Item"
          try {
            refItem = await this.Addon.utils.createItemByZotero(reference.identifiers, (collections || item.getCollections()))
          } catch (e) {
            this.showProgressWindow(`Add ${source}`, JSON.stringify(reference.identifiers) + "\n" + e.toString(), "fail")
            setState("+")
            this.Addon.toolkit.Tool.log(e)
            return
          }
        }
      }
      // addRelatedItem
      log("addRelatedItem")
      item.addRelatedItem(refItem)
      refItem.addRelatedItem(item)
      await item.saveTx()
      await refItem.saveTx()
      // button
      setState("-")
      this.showProgressWindow(`Added with ${source}`, refItem.getField("title"), "success")
    }

    let getCollectionPath = async (id) => {
      let path = []
      while (true) {
        let collection = await Zotero.Collections.getAsync(id)
        path.push(collection._name)
        if (collection._parentID) {
          id = collection._parentID
        } else {
          break
        }
      }
      console.log(path)
      return path.reverse().join("/")
    }

    let timer = null, tipNode
    const box = row.querySelector("#reference-box") as XUL.Box
    box.addEventListener("mouseenter", () => {
      if (!this.Addon.prefs.get("isShowTip")) { return }
      box.classList.add("active")
      const refText = reference.text
      let timeout = parseInt(this.Addon.prefs.get("showTipAfterMillisecond") as string)
      timer = window.setTimeout(async () => {
        let toTimeInfo = (t) => {
          if (!t) { return undefined }
          let info = (new Date(t)).toString().split(" ")
          return `${info[1]} ${info[3]}`
        }
        tipNode = this.showTip(
          idText || "Reference",
          [],
          [],
          refText,
          box
        )
        let info: ItemInfo, source
        log("reference", reference)
        if (reference?.identifiers.arXiv) {
          info = await this.Addon.utils.API.getArXivInfo(reference.identifiers.arXiv)
          source = "arXiv"
        } else if (reference?.identifiers.DOI) {
          let coroutines = [
            this.Addon.utils.API.getDOIInfoBySemanticscholar(reference.identifiers.DOI),
            this.Addon.utils.API.getDOIInfoByCrossref(reference.identifiers.DOI)
          ]
          info = await coroutines[
            parseInt(this.Addon.prefs.get("DOIInfoIndex") as string) % coroutines.length
          ]
          source = "DOIInfo"
        } else {
          let coroutines = [
            this.Addon.utils.API.getTitleInfoByReadpaper(refText),
            this.Addon.utils.API.getTitleInfoByCrossref(refText)
          ]
          info = await coroutines[
            parseInt(this.Addon.prefs.get("TitleInfoIndex") as string) % coroutines.length
          ]
          source = "TitleInfo"
        }
        const sourceConfig = {
          arXiv: { color: "#b31b1b", tip: "arXiv is a free distribution service and an open-access archive for 2,186,475 scholarly articles in the fields of physics, mathematics, computer science, quantitative biology, quantitative finance, statistics, electrical engineering and systems science, and economics. Materials on this site are not peer-reviewed by arXiv."},
          readpaper: { color: "#1f71e0", tip: "论文阅读平台ReadPaper共收录近2亿篇论文、2.7亿位作者、近3万所高校及研究机构，几乎涵盖了全人类所有学科。科研工作离不开论文的帮助，如何读懂论文，读好论文，这本身就是一个很大的命题，我们的使命是：“让天下没有难读的论文”" },
          semanticscholar: { color: "#1857b6", tip: "Semantic Scholar is an artificial intelligence–powered research tool for scientific literature developed at the Allen Institute for AI and publicly released in November 2015. It uses advances in natural language processing to provide summaries for scholarly papers. The Semantic Scholar team is actively researching the use of artificial-intelligence in natural language processing, machine learning, Human-Computer interaction, and information retrieval." },
          crossref: { color: "#89bf04", tip: "Crossref is a nonprofit association of approximately 2,000 voting member publishers who represent 4,300 societies and publishers, including both commercial and nonprofit organizations. Crossref includes publishers with varied business models, including those with both open access and subscription policies." },
          DOI: { color: "#fcb426" }
        }
        if (info) {
          let tags = info.tags.map((tag: object | string) => {
            if (typeof tag == "object") {
              return { color: "#59C1BD", ...(tag as object)}
            } else {
              return { color: "#59C1BD", text: tag }
            }
          }) as any
          if (info.source) { tags.push({ text: info.source, ...sourceConfig[info.source], source: source }) }
          if (info.identifiers.DOI) {
            let DOI = info.identifiers.DOI
            tags.push({ text: "DOI", color: sourceConfig.DOI.color, tip: DOI, url: info.url })
          }
          if (info.identifiers.arXiv) {
            let arXiv = info.identifiers.arXiv
            tags.push({ text: "arXiv", color: sourceConfig.arXiv.color, tip: arXiv, url: info.url })
          }
          tipNode = this.showTip(
            this.Addon.utils.Html2Text(info.title),
            tags,
            [
              info.authors.slice(3).join(" / "),
              [info?.primaryVenue, toTimeInfo(info.publishDate) || info.year].join(" \u00b7 ")
            ],
            this.Addon.utils.Html2Text(info.abstract),
            box
          )
        }
      }, timeout);
    })

    box.addEventListener("mouseleave", () => {
      box.classList.remove("active")
      window.clearTimeout(timer);
      let timeout = parseInt(Zotero.Prefs.get(`${this.Addon.addonRef}.removeTipAfterMillisecond`) as string)
      this.tipTimer = window.setTimeout(async () => {
        // 监测是否连续一段时间内无active
        for (let i = 0; i < timeout / 2; i++) {
          if (rows.querySelector(".active")) { return }
          await Zotero.Promise.delay(1/1000)
        }
        tipNode && tipNode.remove()
      }, timeout / 2)
    })

    label.addEventListener("click", async (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (label.value == "+") {
        if (event.ctrlKey) {
          let collection = ZoteroPane.getSelectedCollection();
          log(collection)
          if (collection) {
            this.showProgressWindow("Adding to collection", `${await getCollectionPath(collection.id)}`)
            await add([collection.id])
          } else {
            this.showProgressWindow("Tip", "Please select your coolection and retry")
          }
        } else {
          await add()
        }
      } else if (label.value == "-") {
        await remove()
      }
    })

    row.append(box, label);
    // const rows = node.querySelector("#referenceRows")
    const rows = node.querySelector("[id$=Rows]")
    rows.appendChild(row);
    let referenceNum = rows.childNodes.length
    if (addSearch && referenceNum && !node.querySelector("#zotero-reference-search")) { this.addSearch(node) }
    return row
  }

  public insertAfter(node, _node) {
    this.Addon.toolkit.Tool.log("nextSibling", _node.nextSibling)
    if (_node.nextSibling) {
      this.Addon.toolkit.Tool.log("insert After")
      _node.parentNode.insertBefore(node, _node.nextSibling);
    } else {
      _node.parentNode.appendChild(node);
    }
  }
  
  public unInitViews() {
    this.removeUI()
  }

  public showTip(title, tags: {source: string; text: string, color: string, tip?: string, url?: string}[], descriptions: string[], content: string, element: XUL.Element) {
    if (!element.classList.contains("active")) { return }
    let shadeMillisecond = parseInt(Zotero.Prefs.get(`${this.Addon.addonRef}.shadeMillisecond`) as string)
    document.querySelectorAll(".zotero-reference-tip").forEach(e => {
      e.style.opacity = "0"
      window.setTimeout(() => {
        e.remove()
      }, shadeMillisecond);
    })
    const winRect = document.querySelector('#main-window').getBoundingClientRect()
    const rect = element.getBoundingClientRect()

    const ZoteroPDFTranslate = Zotero.ZoteroPDFTranslate
    const addonRef = this.Addon.addonRef
    let translateNode = async function(event) {
      if (event.ctrlKey && Zotero.Prefs.get(`${addonRef}.ctrlClickTranslate`)) {
        let sourceText = this.getAttribute("sourceText")
        let translatedText = this.getAttribute("translatedText")
        console.log(sourceText, translatedText)
        if (!sourceText) {
          sourceText = this.innerText;
          this.setAttribute("sourceText", sourceText)
        }
        if (!translatedText) {
          ZoteroPDFTranslate._sourceText = sourceText
          const success = await ZoteroPDFTranslate.translate.getTranslation()
          if (!success) {
            ZoteroPDFTranslate.view.showProgressWindow(
              "Translate Failed",
              success,
              "fail"
            );
            return
          }
          translatedText = ZoteroPDFTranslate._translatedText;
          this.setAttribute("translatedText", translatedText)
        }

        if (this.innerText == sourceText) {
          console.log("-> translatedText")
          this.innerText = translatedText
        } else if (this.innerText == translatedText) {
          this.innerText = sourceText
          console.log("-> sourceText")
        }
      }
    }

    let transformNode = function(event) {
      if (!event.ctrlKey) { return }
      let _scale = tipNode.style.transform.match(/scale\((.+)\)/)
      let scale = _scale ? parseFloat(_scale[1]) : 1
      let minScale = 1, maxScale = 1.7, step = 0.05
      if (tipNode.style.bottom == "0px") {
        tipNode.style.transformOrigin = "center bottom"
      } else {
        tipNode.style.transformOrigin = "center center"
      }
      if (event.detail > 0) {
        // 缩小
        scale = scale - step
        tipNode.style.transform = `scale(${scale < minScale ? 1 : scale})`;
      } else {
        // 放大
        scale = scale + step
        tipNode.style.transform = `scale(${scale > maxScale ? maxScale : scale})`;
      }
    }

    let copyText = (text) => {
      this.Addon.toolkit.Tool.getCopyHelper().addText(text, "text/unicode").copy();
      this.showProgressWindow("Copy", text, "success")
    }

    const tipNode = this.Addon.toolkit.UI.creatElementsFromJSON(
      document,
      {
        tag: "div",
        classList: ["zotero-reference-tip"],
        styles: {
          position: "fixed",
          width: "800px",
          right: `${winRect.width - rect.left + 22}px`,
          top: `${rect.top}px`,
          zIndex: "999",
          "-moz-user-select": "text",
          border: "2px solid #7a0000",
          padding: ".5em",
          backgroundColor: "#f0f0f0",
          transition: `opacity ${shadeMillisecond / 1000}s linear`,
        },
        listeners: [
          {
            type: "DOMMouseScroll",
            listener: transformNode
          },
          {
            type: "mouseenter",
            listener: () => {
              window.clearTimeout(this.tipTimer);
            }
          },
          {
            type: "mouseleave",
            listener: () => {
              let timeout = parseInt(Zotero.Prefs.get(`${this.Addon.addonRef}.removeTipAfterMillisecond`) as string)
              this.tipTimer = window.setTimeout(() => {
                tipNode.remove()
              }, timeout)
            }
          }
        ],
        subElementOptions: [
          {
            tag: "span",
            classList: ["title"],
            styles: {
              display: "block",
              fontWeight: "bold",
            },
            directAttributes: {
              innerText: title
            },
            listeners: [
              {
                type: "click",
                listener: translateNode
              }
            ]
          },
          ...(tags && tags.length > 0 ? [{
            tag: "div",
            id: "tags",
            styles: {
              width: "100%",
              margin: "0.5em 0px",
            },
            subElementOptions: ((tags) => {
              if (!tags) { return []}
              let arr = []
              for (let tag of tags) {
                console.log(tag)
                arr.push({
                  tag: "span",
                  directAttributes: {
                    innerText: tag.text
                  },
                  styles: {
                    backgroundColor: tag.color,
                    borderRadius: "10px",
                    marginRight: "1em",
                    padding: "0 8px",
                    color: "white",
                    cursor: "pointer",
                    userSelect: "none"
                  },
                  listeners: [
                    {
                      type: "click",
                      listener: () => {
                        console.log(tag)
                        if (tag.url) {
                          this.showProgressWindow("Launching URL", tag.url)
                          Zotero.launchURL(tag.url);
                        } else if (tag.source) { 
                          this.showProgressWindow("Switch source", tag.source, "success")
                          const k = `${tag.source}Index`
                          this.Addon.prefs.set(
                            k,
                            parseInt(this.Addon.prefs.get(k) as string) + 1
                          )
                          tipNode.remove()
                        } else {
                          copyText(tag.text)
                        }
                      }
                    },
                    {
                      type: "mouseenter",
                      listener: () => {
                        if (!tag.tip) { return }
                        Zotero.ZoteroReference.views.showProgressWindow("Reference", tag.tip, "default", -1, -1)
                      }
                    },
                    {
                      type: "mouseleave",
                      listener: () => {
                        if (!tag.tip) { return }
                        Zotero.ZoteroReference.views.progressWindow.close();
                      }
                    }
                  ]
                })
              }
              return arr
            })(tags) as any
          }] : []),
          ...(descriptions && descriptions.length > 0 ? [{
            tag: "div",
            id: "descriptions",
            styles: {
              marginBottom: "0.25em"
            },
            subElementOptions: (function (descriptions) {
              if (!descriptions) { return [] }
              let arr = [];
              for (let text of descriptions) {
                console.log(text)
                arr.push({
                  tag: "span",
                  id: "content",
                  styles: {
                    display: "block",
                    lineHeight: "1.5em",
                    opacity: "0.5",
                    cursor: "pointer",
                    userSelect: "none"
                  },
                  directAttributes: {
                    innerText: text
                  },
                  listeners: [
                    {
                      type: "click",
                      listener: () => {
                        copyText(text)
                      }
                    }
                  ]
                })
              }
              return arr
            })(descriptions) as any
          }] : []),
          {
            tag: "span",
            id: "content",
            directAttributes: {
              innerText: content
            },
            styles: {
              display: "block",
              lineHeight: "1.5em",
              textAlign: "justify",
              opacity: "0.8",
              maxHeight: "300px",
              overflowY: "auto"
            },
            listeners: [
              {
                type: "click",
                listener: translateNode
              }
            ]
          }
        ]
      }
    ) as HTMLDivElement

    document.querySelector('#main-window').appendChild(tipNode)

    let boxRect = tipNode.getBoundingClientRect()
    if (boxRect.bottom >= winRect.height) {
      tipNode.style.top = ""
      tipNode.style.bottom = "0px"
    }
    tipNode.style.opacity = "1";
    return tipNode
  }

  public showProgressWindow(
    header: string,
    context: string,
    type: string = "default",
    t: number = 5000,
    maxLength: number = 100
  ) {
    console.log(arguments)
    if (this.progressWindow) {
      this.progressWindow.close();
    }
    let progressWindow = new Zotero.ProgressWindow({ closeOnClick: true });
    this.progressWindow = progressWindow
    progressWindow.changeHeadline(header);
    progressWindow.progress = new progressWindow.ItemProgress(
      this.progressWindowIcon[type],
      (maxLength > 0 && context.length > maxLength) ? context.slice(0, maxLength) + "..." : context
    );
    progressWindow.show();
    if (t > 0) {
      progressWindow.startCloseTimer(t);
    }
    return progressWindow
  }
}

export default AddonViews;
