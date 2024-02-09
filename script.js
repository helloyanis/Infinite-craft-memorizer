const LS = browser.storage.local;
//Utility functions
function isItemAlreadyFound(myItem) {
  /*
    Returns true if the item is already found in the website's localStorage
  */
  browser.tabs.executeScript({ code: `localStorage["infinite-craft-data"]` }).then((res) => {
    data = JSON.parse(res)
    return (data.elements.some(item =>
      Object.keys(myItem).every(key => item[key] === myItem[key])
    ));
  });
}

async function isItemAlreadyStored(myItem) {
  /*
    Returns true if the item is already found in the add-on's localStorage
  */
  const res = await LS.get(`${myItem.text}`)
  if (Object.keys(res).length === 0) {
    return true;
  } else {
    return false;
  }
}

async function getExportData() {
  /*
    Returns a JSON string of all the items stored in the add-on's localStorage
  */
  try {
    const res = await LS.get(null);
    let data = [];
    Object.keys(res).forEach((key) => {
      data.push(JSON.parse(res[key]));
    });
    return JSON.stringify(data);
  } catch (error) {
    console.error("Error getting export data:", error);
    throw error; // Propagate the error
  }
}

async function storeAllItems() {
  /*
    Goes through all items from the website's localStorage and stores them in the add-on's localStorage if the're not already there
  */
  browser.tabs.executeScript({ code: `localStorage["infinite-craft-data"]` }).then((res) => {
    data = JSON.parse(res)
    data.elements.forEach((item) => {
      if (!isItemAlreadyStored(item)) {
        LS.set({ [item.text]: JSON.stringify({ emoji: item.emoji, text: item.text, fusions: [] }) });
      }
    });
  });
}

async function restoreAllItems() {
  /*
    Goes through all items from the add-on's localStorage and stores them in the website's localStorage if the're not already there
  */
  const res = await LS.get(null);
  Object.keys(res).forEach(async (key) => {
    let item = JSON.parse(res[key]);
    console.log(item);
    if (!isItemAlreadyFound(item)) {
      await createItem(item);
    }
  });

}

async function createItem(myItem) {
  /*
    Creates a new item on the page and saves it to the page's localStorage
  */
  let newElement = {
    text: myItem.text,
    emoji: myItem.emoji,
    discovered: false
  };
  if(!isItemAlreadyFound(myItem)){
    await browser.tabs.executeScript({code: `
    localData=JSON.parse(localStorage["infinite-craft-data"])
    localData.elements.push(${JSON.stringify(myItem)})
    localStorage.setItem("infinite-craft-data", JSON.stringify(localData))
    `});
  }
}

const regexEmoji = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;

//Page functions
document.addEventListener("DOMContentLoaded", (event) => {
  function goToItemPage(myItem) {
    /*
      Changes the page to the item page and displays the item's data
    */
    document.querySelector(".mainCont").style.display = "none";
    document.querySelector(".itemCont").style.display = "block";
    document.querySelector("#itemName").textContent = `${myItem.emoji} ${myItem.text}`;
    document.querySelector("#itemFusionList").innerHTML = "";
    LS.get(myItem.text).then((itemData) => {
      JSON.parse(itemData[myItem.text]).fusions.forEach((fusion) => {
        let firstButton = document.createElement("button");
        firstButton.textContent = fusion.first;
        firstButton.addEventListener('click', function () {
          LS.get(fusion.first).then((res) => {
            goToItemPage(JSON.parse(res[fusion.first]));
          });
        });

        let secondButton = document.createElement("button");
        secondButton.textContent = fusion.second;
        secondButton.addEventListener('click', function () {
          LS.get(fusion.second).then((res) => {
            goToItemPage(JSON.parse(res[fusion.second]));
          });
        });
        document.querySelector("#itemFusionList").appendChild(firstButton);
        document.querySelector("#itemFusionList").appendChild(secondButton);
        document.querySelector("#itemFusionList").appendChild(document.createElement("br"));
      });
      if (JSON.parse(itemData[myItem.text]).fusions.length == 0) {
        document.querySelector("#itemFusionList").textContent = "No data yet!";
      }
    });
  }

  document.querySelector("#closeItemPage").addEventListener("click", () => {
    /*
      Closes the item page and goes back to the main page
    */
    document.querySelector(".itemCont").style.display = "none";
    document.querySelector(".mainCont").style.display = "block";
  });

  document.querySelector("#goToImportPage").addEventListener("click", () => {
    /*
      Changes the page to the import page
    */
    document.querySelector(".importCont").style.display = "block";
    document.querySelector(".mainCont").style.display = "none";
  });

  document.querySelector("#closeImportPage").addEventListener("click", () => {
    /*
      Closes the import page and goes back to the main page
    */
    document.querySelector(".importCont").style.display = "none";
    document.querySelector(".mainCont").style.display = "block";
  });

  document.querySelector("#goToExportPage").addEventListener("click", () => {
    /*
      Changes the page to the export page and displays the export data
    */
    document.querySelector(".exportCont").style.display = "block";
    document.querySelector(".mainCont").style.display = "none";
    (async () => {
      try {
        const exportData = await getExportData();
        document.querySelector("#exportArea").value = exportData;
      } catch (error) {
        console.error(error);
      }
    })();
  });

  document.querySelector("#importItems").addEventListener("click", () => {
    /*
      Imports the data from the import textarea and stores it in the add-on's localStorage
    */
    let importData = document.querySelector("#importArea").value;
    try {
      let data = JSON.parse(importData);
      data.forEach((item) => {
        LS.set({ [item.text]: JSON.stringify({ emoji: item.emoji, text: item.text, fusions: [] }) });
      });
      document.querySelector("#importItems").textContent = "✅ Imported!";
      setTimeout(() => {
        document.querySelector("#importItems").textContent = "Import";
      }, 2000);
    } catch (error) {
      document.querySelector("#importItems").textContent = "❌ Error!";
    }
  });

  document.querySelector("#closeExportPage").addEventListener("click", () => {
    /*
      Closes the export page and goes back to the main page
    */
    document.querySelector(".exportCont").style.display = "none";
    document.querySelector(".mainCont").style.display = "block";
  });

  document.querySelector("#goToBuildItemPage").addEventListener("click", () => {
    /*
      Changes the page to the build item page
    */
    document.querySelector(".buildItemCont").style.display = "block";
    document.querySelector(".mainCont").style.display = "none";
  });

  document.querySelector("#buildItem").addEventListener("click", () => {
    /*
      Builds a new item on the page and stores it in the add-on's localStorage
    */
    let emoji = document.querySelector("#itemEmoji").value
    if (!regexEmoji.test(emoji)){
      return document.querySelector("#buildItem").textContent = "❌ Not an emoji";;
    }
    let text = document.querySelector("#itemNameInput").value
    if (text === "") {
      return document.querySelector("#buildItem").textContent = "❌ No name";
    }
    let myItem = { emoji: emoji, text: text, fusions: [] };
    (async () => {
        await createItem(myItem);
        document.querySelector("#buildItem").textContent = "✅ Item created! Refresh the page.";
    })();
  });

  document.querySelector("#buildAllItems").addEventListener("click", () => {
    /*
      Builds all of the items in the database of the add-on
    */
    (async () => {
      await restoreAllItems();
      document.querySelector("#buildAllItems").textContent = "✅ All items created! Refresh the page.";
    })();
  })

  document.querySelector("#closeBuildItemPage").addEventListener("click", () => {
    /*
      Closes the build item page and goes back to the main page
    */
    document.querySelector(".buildItemCont").style.display = "none";
    document.querySelector(".mainCont").style.display = "block";
  });

  function listPageItems() {
    /*
      Lists all the items from the website's localStorage and adds them to the main page
    */
    browser.tabs.executeScript({ code: `localStorage["infinite-craft-data"]` }).then((res) => {
      data = JSON.parse(res)
      LS.get(null).then((res) => {
        /*
          Adds the items from the add-on's localStorage (useful if you imported an item list)
        */
        Object.keys(res).forEach((key) => {
          let item = JSON.parse(res[key]);
          if (!data.elements.some((element) => element.text === item.text)) {
            data.elements.push(item);
          }
        });
        data.elements.forEach((item) => {
          /*
            Display buttons for each item
          */
          let button = document.createElement("button");
          button.textContent = `${item.emoji} ${item.text}`;
          button.addEventListener('click', function (event) {
            goToItemPage(item);
          });
          document.querySelector("#itemList").appendChild(button);
          (async () => {
            if (await isItemAlreadyStored(item)) {
              LS.set({ [item.text]: JSON.stringify({ emoji: item.emoji, text: item.text, fusions: [] }) });
            }
          })();
        });
      });
    });
  }

  document.querySelector("#search").addEventListener("input", (event) => {
    /*
      Handle searching through items
    */
    let search = event.target.value;
    let buttons = document.querySelectorAll("#itemList button");
    buttons.forEach((button) => {
      if (button.textContent.toLowerCase().includes(search.toLowerCase())) {
        button.style.display = "inline-block";
      } else {
        button.style.display = "none";
      }
    });
  });
  listPageItems();
});

