# 最终修复方案

## 问题
Model 下拉框没有选项

## 根本原因
模型对象缺少 `displayName` 字段，导致下拉框无法显示

## 修复步骤

### 1. 重启开发服务器

```bash
# 停止当前运行的服务器 (Ctrl+C)
# 然后重新启动
cd /Users/xingqiangchen/DeepMicroPath/frontend
yarn dev
```

### 2. 在浏览器控制台运行修复脚本

打开浏览器，按 **F12** (Mac: **Cmd+Opt+I**)，进入 **Console** 标签，复制粘贴并运行：

```javascript
// 最终修复脚本 - 包含 displayName
console.log('🔧 最终修复 - 重置 DeepMicroPath 模型...');

const models = [
  {
    name: "deepmicropath-auto",
    displayName: "deepmicropath-auto",
    available: true,
    sorted: 1000,
    provider: {
      id: "deepmicropath",
      providerName: "DeepMicroPath",
      providerType: "deepmicropath",
      sorted: 1
    }
  },
  {
    name: "deepmicropath-chat",
    displayName: "deepmicropath-chat",
    available: true,
    sorted: 1001,
    provider: {
      id: "deepmicropath",
      providerName: "DeepMicroPath",
      providerType: "deepmicropath",
      sorted: 1
    }
  },
  {
    name: "deepmicropath-deepresearch",
    displayName: "deepmicropath-deepresearch",
    available: true,
    sorted: 1002,
    provider: {
      id: "deepmicropath",
      providerName: "DeepMicroPath",
      providerType: "deepmicropath",
      sorted: 1
    }
  },
  {
    name: "deepmicropath-microbiology-report",
    displayName: "deepmicropath-microbiology-report",
    available: true,
    sorted: 1003,
    provider: {
      id: "deepmicropath",
      providerName: "DeepMicroPath",
      providerType: "deepmicropath",
      sorted: 1
    }
  }
];

// 完全清除并重新初始化
localStorage.removeItem('app-config');
localStorage.removeItem('access-control');

// 创建新的配置
const newConfig = {
  version: 5.0,
  state: {
    models: models,
    modelConfig: {
      model: "deepmicropath-chat",
      providerName: "DeepMicroPath",
      temperature: 0.5,
      top_p: 1,
      max_tokens: 4000,
      presence_penalty: 0,
      frequency_penalty: 0
    },
    customModels: ""
  }
};

const newAccess = {
  version: 3,
  state: {
    provider: "DeepMicroPath",
    deepmicropathUrl: "http://172.20.1.38:8000/api/v1",
    deepmicropathApiKey: "",
    customModels: "",
    defaultModel: "deepmicropath-chat"
  }
};

localStorage.setItem('app-config', JSON.stringify(newConfig));
localStorage.setItem('access-control', JSON.stringify(newAccess));

console.log('✅ 配置已重置！');
console.log('✅ 模型列表:', models.map(m => m.name));
console.log('🔄 正在刷新页面...');

setTimeout(() => {
  location.reload();
}, 500);
```

### 3. 验证

页面刷新后：
1. 进入设置 (⚙️)
2. 找到 "Model" 部分
3. 应该看到下拉框有 4 个选项：
   - deepmicropath-auto
   - deepmicropath-chat
   - deepmicropath-deepresearch
   - deepmicropath-microbiology-report

## 紧凑版脚本（一行）

如果需要快速执行，复制这一行：

```javascript
const m=[{name:"deepmicropath-auto",displayName:"deepmicropath-auto",available:true,sorted:1000,provider:{id:"deepmicropath",providerName:"DeepMicroPath",providerType:"deepmicropath",sorted:1}},{name:"deepmicropath-chat",displayName:"deepmicropath-chat",available:true,sorted:1001,provider:{id:"deepmicropath",providerName:"DeepMicroPath",providerType:"deepmicropath",sorted:1}},{name:"deepmicropath-deepresearch",displayName:"deepmicropath-deepresearch",available:true,sorted:1002,provider:{id:"deepmicropath",providerName:"DeepMicroPath",providerType:"deepmicropath",sorted:1}},{name:"deepmicropath-microbiology-report",displayName:"deepmicropath-microbiology-report",available:true,sorted:1003,provider:{id:"deepmicropath",providerName:"DeepMicroPath",providerType:"deepmicropath",sorted:1}}];localStorage.clear();localStorage.setItem('app-config',JSON.stringify({version:5.0,state:{models:m,modelConfig:{model:"deepmicropath-chat",providerName:"DeepMicroPath",temperature:0.5,top_p:1,max_tokens:4000},customModels:""}}));localStorage.setItem('access-control',JSON.stringify({version:3,state:{provider:"DeepMicroPath",deepmicropathUrl:"http://172.20.1.38:8000/api/v1",customModels:"",defaultModel:"deepmicropath-chat"}}));console.log('✅ Fixed!');setTimeout(()=>location.reload(),500);
```

## 如果还是不行

### 方案 A: 完全重置

```javascript
// 核选项 - 清除所有数据
Object.keys(localStorage).forEach(key => {
  if (key.includes('evidenceseek') || key.includes('app-config') || key.includes('access')) {
    localStorage.removeItem(key);
  }
});
sessionStorage.clear();
console.log('✅ 完全清除！刷新中...');
setTimeout(() => location.reload(), 500);
```

然后再运行上面的修复脚本。

### 方案 B: 使用隐身模式

1. 停止开发服务器
2. 重新启动: `yarn dev`
3. 使用隐身/无痕模式打开
4. 运行修复脚本

## 代码已修复

我已经修复了代码：
- ✅ `app/constant.ts` 添加了 `displayName` 字段
- ✅ `app/store/config.ts` 修复了 merge 逻辑

下次启动新实例时会自动正常工作。

## 技术细节

问题出在：
1. `DEFAULT_MODELS` 定义缺少 `displayName`
2. `ModelConfigList` 组件需要 `displayName` 来显示选项
3. 迁移逻辑需要保留完整的模型对象结构

修复：
```typescript
// 之前
...deepmicropathModels.map((name) => ({
  name,
  available: true,
  // 缺少 displayName
}))

// 现在  
...deepmicropathModels.map((name) => ({
  name,
  displayName: name,  // ← 添加这个
  available: true,
}))
```
