#!/bin/bash
# Push DeepMicroPath-frontend to GitHub

cd /Users/xingqiangchen/DeepMicroPath/frontend

echo "正在推送到 GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ 推送成功！"
    echo "仓库地址: https://github.com/chenxingqiang/DeepMicroPath-frontend"
else
    echo "❌ 推送失败，请检查网络连接和 SSH 密钥配置"
fi



