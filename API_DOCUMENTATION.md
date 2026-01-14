# 年会能量汇聚系统接口文档
## 1. 系统架构概述
- 前端框架：React + Vite
- 后端框架：Express + Socket.io
- 通信方式：Socket.io 实时推送（核心业务） + REST 接口（辅助操作）
- 代码参考：
  - 后端事件处理：[server/index.js](file:///c:/Users/staff3/Documents/trae_projects/newyear2/ui-restoration/server/index.js)
  - 前端事件监听：[BigScreen.jsx](file:///c:/Users/staff3/Documents/trae_projects/newyear2/ui-restoration/src/pages/BigScreen.jsx#L151-L186)
  - 手机端提交逻辑：[MobileEntry.jsx](file:///c:/Users/staff3/Documents/trae_projects/newyear2/ui-restoration/src/pages/MobileEntry.jsx#L77-L90)

## 2. Socket.io 接口定义
### 2.1 客户端 → 服务器事件
| 事件名       | 参数结构       | 功能描述                     | 测试要点                     |
|--------------|----------------|------------------------------|------------------------------|
| user_submit  | { name: string }| 用户提交姓名，注入能量       | 验证姓名非空校验、服务器响应 |

### 2.2 服务器 → 客户端事件
| 事件名           | 数据结构示例                                                                 | 功能描述                     |
|------------------|------------------------------------------------------------------------------|------------------------------|
| init             | { progress: 88.5, isComplete: false, submissionCount: 5, serverIp: "172.20.30.178", port: 3001 } | 客户端连接时推送初始状态     |
| progress_update  | 88.6                                                                         | 推送能量进度更新             |
| new_log          | { timestamp: "10:46:39", message: "测试用户-572 已成功注入能量！", type: "info" } | 推送最新操作日志             |
| spawn_particle   | { name: "测试用户-572" }                                                    | 推送姓名气泡生成指令         |
| completion       | { name: "Admin" }                                                           | 推送充能完成通知             |

## 3. REST 接口定义
| 请求方式 | 接口路径 | 功能描述                     | 测试要点                     |
|----------|----------|------------------------------|------------------------------|
| POST     | /reset   | 重置所有能量状态（进度、日志、气泡） | 验证重置后状态是否归零       |

## 4. 测试指南
### 4.1 实时通信测试步骤
1. 启动前端服务：`npm run dev`（端口 5173）
2. 启动后端服务：`npm run server`（端口 3001）
3. 使用 Socket.io 客户端发送 `user_submit` 事件
4. 验证点：
   - 大屏是否显示姓名气泡（参考 BigScreen.jsx 第 36-49 行）
   - 进度条是否增长（参考 server/index.js 第 53-65 行）
   - 日志是否更新（参考 BigScreen.jsx 第 96-100 行）

### 4.2 异常场景测试
- 空姓名提交：验证服务器是否忽略无效请求
- 断网重连：验证客户端是否自动恢复连接
- 高并发提交：验证姓名气泡是否无重叠（参考 BigScreen.jsx 第 42 行随机位置逻辑）

## 5. 版本历史
| 版本号 | 修改时间 | 修改内容                     |
|--------|----------|------------------------------|
| v1.0   | 2026-01-14 | 初始版本，完成核心接口定义   |