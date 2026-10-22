# Git 日常操作

## 三个区域（理解这个就够了）

```
你的文件夹  --add-->  暂存区  --commit-->  本地仓库  --push-->  GitHub
 (改了文件)            (装进箱子)          (封箱贴标签)        (寄出去)
```

- `add` = 把改动装进箱子
- `commit` = 封箱、贴标签（这一步只有你自己电脑知道）
- `push` = 把箱子寄到 GitHub（这一步别人才看得见）

**只 commit 不 push，GitHub 上什么都没有。**

---

## 每天的标准动作

```powershell
cd D:\develop\longchang
git add -A
git commit -m "今天搞懂了什么"
git push
```

一行版（message 自己改）：

```powershell
git add -A; git commit -m "今天的说明"; git push
```

---

## commit message 怎么写

```
模板：搞懂了什么；踩坑——踩了什么坑
```

| ❌ 没用 | ✅ 有用 |
|---|---|
| update | 列表推导式；踩坑——生成器只能用一次 |
| 修改 | 第一次调通 DeepSeek API，key 放环境变量里 |
| 提交 | RAG 的 chunk_size 试了 500 和 1000，500 召回更准 |
| . | Java 里 String 用 == 比不中，要用 equals |

三个月后你只会看这一行字，看不懂就白记了。

---

## 写代码之前（可选）

```powershell
git pull
```

**只有一种情况必须做：你在 GitHub 网页上改过东西。** 否则可以跳。

---

## 后悔药

**改了还没 commit，想全部撤销：**

```powershell
git restore .
```

**刚 commit 完发现错了，想退回提交前（改动保留）：**

```powershell
git reset --soft HEAD~1
```

**看历史 / 看现状：**

```powershell
git log --oneline     # 一行一条历史
git status            # 现在有什么没提交
git diff              # 具体改了哪几行
```

---

## 报错速查

| 报错 | 原因 | 解法 |
|---|---|---|
| `rejected ... fetch first` | GitHub 上有你本地没有的提交 | `git pull` 再 `git push` |
| `nothing to commit` | 没改动，或忘了 `git add` | 用 `git status` 看 |
| `not a git repository` | 不在仓库目录里 | `cd D:\develop\longchang` |
| `Authentication failed` | 登录凭据过期 | 删掉 Windows 里的 git 凭据重新登录 |
| `Connection was reset` | 代理没开 | 见下面「代理」一节 |

---

## ⚠️ 代理（最容易踩的坑）

这台机器的 git 走代理 `127.0.0.1:7892`。

**代理软件没开 → 所有 push / pull 都会失败。**

临时关掉代理：

```powershell
git config --global --unset http.proxy
git config --global --unset https.proxy
```

重新打开代理（端口变了就改数字）：

```powershell
git config --global http.proxy http://127.0.0.1:7892
git config --global https.proxy http://127.0.0.1:7892
```

---

## 四件不要做的事

1. **不要把 `.env`、密码、Token 提交上去**（`.gitignore` 已挡，但别手动覆盖）
2. **不要 `git reset --hard`** —— 会真的删掉没提交的改动，找不回来
3. **不要为了凑数提交 `update`**
4. **不要在仓库里放模型文件、数据集、视频**（单个超 100MB 会被拒）
