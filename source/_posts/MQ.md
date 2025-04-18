---
title: 万字带你深度了解MQ消息队列
author: NuyoahCh
date: 2025-02-26 20:42:30
description: 深入探索Kafka奥妙
tags: [MQ]
categories:
 - [万字详解系列文章分享〄]
 - [MQ] ##目录
top: true
# cover: /img/background.png
---

# MQ 消息队列 📡

**首先我们人的精力是有限的，从投入产出来说，深入学习一种消息队列就够了，因为消息队列的使用都是相通的，只要你掌握了其中一种消息队列，你就可以说你会消息队列了，这就如同你无论掌握Java还是Go或者其它语言，你都可以说自己会写代码了**

*   事实确实这般如此，那么不管是学习一门语言还是组件的时候，我们首先要明白其本质和作用

**Kafka** 是最主流的消息队列之一，被国内外大厂广泛使用，是经过验证的明星项目，也是学习消息队列的首选，所以本次的深入讲解就使用 **Kafka** 作为学习 MQ 的🌰，进行 MQ 的打怪升级之路吧！



## 1. 消息队列入门篇🚗

### 消息队列是什么

*   消息队列，顾名思义即传递消息的队列，有先入先出的性质，同时，消息队列具备可靠性、高性能等特点

小王在写下这篇 blog 的时候，也是作为**学生**身份，我们不免也会说自己使用过各种各样的消息队列的情况，例如 Kafka（这个是小王比较常用的）、RocketMQ、RabbitMQ （**多种 MQ 的组件的特点一会也会进行比较**）and so on ，确实在当下容器化部署中间件环境的时代，我们在那些之前跟着教程所去实现的一个个项目中，使用了一个消息队列的中间件来去提升我们项目的亮点无可厚非，但是到头来似乎只是为了用而去使用，只看到了那些表面测试的 **TPS/QPS** 数据得到了所谓的提升，但是在业务开发的场景下，我们是否真的需要引入比较消耗资源的消息对列中间件呢，这似乎还是个谜题

**那么废话不多说，即刻发车，开始 MQ 的打怪之路** ， 嘟嘟嘟～～～

*   消息队列是大型分布式系统不可缺少的中间件，一般用于异步流程、消息分发、流量削峰等问题
*   可以通过消息队列实现高性能、高可用、高扩展的架构

![image-20250227002920562](../img/content_pic/image-20250227002920562.png)

**正图中所示，消息队列的目的就是为了消息之间的中转和存储**



#### 消息队列重点

在学习消息队列之前，小王认为，消息队列是实践类的技术，会应用大于懂原理，在工作中一般而言只要能使用消息队列优化架构就完全够了，所以在本章节中，针对于消息队列的实践进行详解和优化，对于 Kafka 的源码理解，后续也会发文进行详细介绍

*   在这里也贴上一个 Kafka 的源码的地址，需要的同学可以进行深入https://github.com/apache/kafka.git



#### 要学多少种消息队列

这个问题也是对于初学者比较想进行发问的

业界比较出名的消息队列有ActiveMQ、RabbitMQ、ZeroMQ、Kafka、MetaMQ、RocketMQ。

**PS：但是对于业界使用最多的还是追求高性能的 Kafka，当然小王对阿里巴巴旗下的 RocketMQ 也是十分的看好哦**



### 消息队列解决什么问题

消息队列本质上就是解决消息传递的问题，对于现在的其他场景就是后续因为业务需求进行拓展的

![img](../img/content_pic/v2-20e723be24718b9415709bacfe938e9d_r.jpg)

**PS：**贴一张图，这就是消息队列的本质的解决问题的场景嘛



#### 消息队列的应用场景

##### 解耦

解耦其本质就是解除耦合，比如我们当前存在两个业务服务A and B，A如果需要等待B的返回，关注返回的结果和数据，或者就是单纯要B服务处理了，A才能给更前端回包，这就是耦合

比如在我们的日常的消息推送过程中，SvrA发送给SvrB，B发给客户，在理想的状态下A只管去进行发送给B，而B也只是去进行消息的推送即可，如果还需要他们之间进行相互的等待时，那么实在是太浪费时间了，性能削减，也没有必要去关注其他进行的运行结果喽

**PS：**这个地方不知道大家是否可以去联想计算机网络中常见的数据传输方式 ：电路交换和分组交换⚛️

![image-20250227125858099](../img/content_pic/image-20250227125858099.png)

如果就像是电路交换之间的进程时刻保持通路占据资源，**那么大名鼎鼎的MQ的作用也就不复存在了**

所以，如果业务上可以去除这种依赖，那么就会获得性能、可靠性等的提升

![image-20250227125834261](../img/content_pic/image-20250227125834261.png)



##### 异步

在从事爬虫、视频渲染、模型训练的很多同学都深有感触，用户很难通过同步接口长时间等待结果，那就应该做成异步，先扔进消息队列，后续再进行消费，和解耦一样可以收获更高的性能，以及获得更好的可靠性

异步和解耦最大的区别在于，解耦是业务上本身就不需要依赖，异步是可能还是需要关注结果，但是不一定干等，可以回头再找

*   这里使用Go语言写一个异步任务的实例供大家理解

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func asyncTask(id int, wg *sync.WaitGroup, ch chan<- string) {
	defer wg.Done() // 任务完成时，调用 Done 来减少 WaitGroup 的计数
	fmt.Printf("Task %d started\n", id)

	// 模拟耗时任务
	time.Sleep(time.Second * 2)

	// 发送任务结果到 Channel
	ch <- fmt.Sprintf("Task %d finished", id)
}

func main() {
	var wg sync.WaitGroup
	ch := make(chan string, 5) // 缓冲区为5，避免阻塞

	// 启动多个异步任务
	for i := 1; i <= 5; i++ {
		wg.Add(1)
		go asyncTask(i, &wg, ch)
	}

	// 等待所有任务完成
	go func() {
		wg.Wait()
		close(ch) // 关闭 Channel
	}()

	// 接收任务结果
	for result := range ch {
		fmt.Println(result)
	}
}

```



##### 消息分发

MQ的本质就是基于对消息进行相应的处理，所以对消息分发的支持更是不言而喻

**给大家讲一个小故事**

假设我们在实现了一个消息推送和分发的任务场景🎬

*   这个时候存在了一个SvrA的服务提供方，和多个服务接收方
*   刚开始由于项目的初步启动并不完善，部门的业务大佬决定让小王先去使用 Redis 的 stream 去实现消息队列
*   当然这样轻量级的MQ，小王在忙碌了一段时间之后不出意外的很快就搭建好
*   随着业务体量的不断增大，并发量的不断增多，大佬发现Redis的作用不足以支持这般排山倒海的压力
*   这个时候由于业务大佬更加熟悉 Kafka 这个消息中间件就对其进行了业务方案的使用⌨️

![image-20250227131202617](../img/content_pic/image-20250227131202617.png)

**当然左右两张图片也就生动的体现了消息队列起到的基本作用辽～～～**



##### 削峰

举个🌰：每天要被人打48拳，1小时之内打完48拳可能人就挺不过去了，但是分散到24小时，1小时两拳，就能存活，这就是削峰

*   有原本陡峭的曲线让其变得平滑稳定

其实在架构上，削峰和上面的异步场景是相同的架构，都是将请求扔入队列中，再慢慢消费

*   但要注意异步场景更偏向于单个请求，本身处理时间很长
*   削峰针对是单个请求ok，但是流量突发扛不住的场景

这就是异步和削峰在本质上的区别



### 消息队列的安装

作为后端开发，其实进入公司之后一般是不需要你来安装Kafka的，要么就是有专门的运维，要么就是直接使用一些云厂商提供的消息队列，但是我们平常做实验的时候，最好还是得安装一下，这里选择最简单的方式来安装单机版的Kafka，目的就是做实验

#### Docker 安装（推荐）

docker安装kafka单机版直接参考这篇文章，亲测可行：​

https://ken.io/note/kafka-standalone-docker-install

安装完成之后，这个命令可以进入kafka容器：

```bash
docker exec -it kafka-test /bin/bash
```

**小王这个地方使用的MacbookPro所以更加倾向于使用docker进行中间件的部署**

*   当然这个地方也是可以使用单机版进行操作的，毕竟就是练手，所以不管是怎么进行操作都是没有问题的

PS：Docker Desktop 在用户本地电脑的进行安装部署实在是太沉重，小王在进行开发的过程中更加倾向于轻量级的软件进行使用

所以也给大家推荐MacBook上可以使用的**orbstack**，贴下链接[🔗](https://orbstack.dev/)



## 2. 消息队列场景篇🚕

### 消息队列解耦

#### 场景

1.   模块A不用等模块B把事情做完，只用将信息传递到一个中转站，B从中转站感知到这件事，再自己去做就可以了，这个中转站，就是消息队列，可以起到解耦的作用

2.   发送短信场景，模块A发送消息给B，模块B发送短信给客户，A不需要得到回应，对于A而言只需要触达B就行了

3.   工作流场景，比如审批，组长审批之后审批流程传递给总监，总监审批之后传递给总经理，而更后面的上级是不需要审批完之后再汇报给下级的，比如总监审批完之后他是不用通知组长的



#### 业务代码

解耦的好处有很多，这里我们可以先关注响应时间。

**解耦前：**

```java 
@PostMapping(value = "/decoupling", consumes = "application/json; charset=utf-8")
public ResponseEntity<String> decoupling(@RequestBody IncrCountReq data) {
    countService.incrManyTimes(10000000);
    return ResponseEntity.ok();
}

public void incrManyTimes(Integer num) {
    for (int i = 0; i < num; i++) {
        incrCountAtomic(num);
    }
}
```

```bash
curl -w "\n cost %{time_total}s" -H "Trace-ID: niuge123" -H "Content-Type: application/json; charset=utf-8" -H "User-ID: 77"  http://localhost:8081/demo/decoupling  -d '{"num":1}'
```

返回结果

```bash
{"code":0,"message":"ok","datetime":null,"data":null}
cost 0.185057s
```

**解耦后：**

```java
@PostMapping(value = "/decoupling_with_mq", consumes = "application/json; charset=utf-8")
public ResponseEntity<String> decouplingWithMQ(@RequestBody IncrCountReq data) {
    String msg = "coming!!!!!!!!!";
    kafkaTemplate.send("tp-mq-decoupling",msg);
    return ResponseEntity.ok();
}
```

没有直接计算，而是把消息传递给了kafka，由kafka消费者来处理：

```java
@KafkaListener(topics = "tp-mq-decoupling", groupId = "TEST_GROUP",concurrency = "1", containerFactory = "kafkaManualAckListenerContainerFactory")
public void topic_test(ConsumerRecord<?, ?> record, Acknowledgment ack, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
    Optional message = Optional.ofNullable(record.value());
    if (message.isPresent()) {
        Object msg = message.get();
        System.out.println("收到Kafka消息! Topic:" + topic + ",Message:" + msg);
        try {
            couontSerivce.incrManyTimes(10000000);
            ack.acknowledge();
            log.info("Kafka消费成功! Topic:" + topic + ",Message:" + msg);
        } catch (Exception e) {
            e.printStackTrace();
            log.error("Kafka消费失败！Topic:" + topic + ",Message:" + msg, e);
        }
    }
}
```

返回结果

```bash
{"code":0,"message":"ok","datetime":null,"data":null} 
cost 0.055067s
```

这里有同学会有疑惑，整体处理时间并没有变短，为何说性能提升了？这里主要是要站在调用方A的角度。

比如A服务调用了B服务做一件事，这个事情要20s，现在异步化了，先丢进Kafka，这个同步接口的时间是不是缩短到非常低了，就几十ms。这就可以说，在同步调用环节，减少了接口响应时间。

甚至，考虑这种情况，A本来就不用关心结果，比如B是一个消息推送，类似于B可以发消息给微信、企业微信等等，A只用把消息传递给B，B再推送给哪个第三方，推送给几个第三方，都是B的事，这种情况，就可以说对于A而言，丢给Kafka之后，后续流程它就不关心了，也就意味着站在A的角度，整个流程的时间缩短了。



### 消息队列削峰

#### 场景

一个模块A接受一波流量，收到之后，立刻调用另一个模块B，那么此时B承担了基本相同的流程，举个例子，模块A一瞬间收到100个请求，那么B基本也是一瞬间收到100个请求，如果B的承压能力非常差，或者B有什么资源限制，那么这100个请求下来，B可能就挂了或者报错了

面对这种下游扛不住的场景，我们还可以有第二种流程：

模块A不用一次性把消息打给B，而是只用将信息传递到一个中转站，B按自身的消费能力从中转站拉取消息，再自己去做就可以了，这个中转站，就是消息队列，可以起到削峰的作用

![image-20250227134649633](../img/content_pic/image-20250227134649633.png)



#### 业务代码

**削峰前**

```java
@PostMapping(value = "/peak_clipping", consumes = "application/json; charset=utf-8")
public ResponseEntity<String> peakClipping(@RequestBody IncrCountReq data) {
    countService.flowArrived();
    return ResponseEntity.ok();
}

public void flowArrived() {
    System.out.println("flow arrived!!!");
}
```

收到请求后，countService会打印"flow arrived!!!"表示流量已经到达。

现在我们要向这个接口连续发送10次调用，来观察流量到达情况，具体测试流程：

1.   需要把下方脚本保存成peak_clip_many_with_mq.sh文件

2.   然后sh peak_clip_many_with_mq.sh，注意，需要是linux或者mac环境下

 ![image-20250227135057921](../img/content_pic/image-20250227135057921.png)

我们可以看到，1s内有10次流量打到B模块，也就是说B模块一瞬间承受了A模块带来的所有压力

**削峰后**

削峰之后就不是直接处理请求，而是把消息传递给了kafka，最后由kafka消费者来处理

```java
@PostMapping(value = "/peak_clipping_with_mq", consumes = "application/json; charset=utf-8")
public ResponseEntity<String> peakClippingWithMQ(@RequestBody IncrCountReq data) {
    String msg = "coming!!!!!!!!!";
    kafkaTemplate.send("tp-mq-peak_clipping",msg);
    return ResponseEntity.ok();
}
```

假设我们消费者每秒就只能消费一条消息，我们主动sleep以简单模拟这种情况：

```java
@KafkaListener(topics = "tp-mq-peakclipping", groupId = "TEST_GROUP",concurrency = "1", containerFactory = "kafkaManualAckListenerContainerFactory")
public void peakClipping(ConsumerRecord<?, ?> record, Acknowledgment ack, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
    Optional message = Optional.ofNullable(record.value());
    if (message.isPresent()) {
        Object msg = message.get();
        System.out.println("收到Kafka消息! Topic:" + topic + ",Message:" + msg);
        try {
            couontSerivce.flowArrived();
            TimeUnit.SECONDS.sleep(1);
            ack.acknowledge();
            log.info("Kafka消费成功! Topic:" + topic + ",Message:" + msg);
        } catch (Exception e) {
            e.printStackTrace();
            log.error("Kafka消费失败！Topic:" + topic + ",Message:" + msg, e);​
        }
    }
}
```

![image-20250227135356212](../img/content_pic/image-20250227135356212.png)



### 消息队列分发

#### 场景

1.   信息更新场景，比如某个用户信息更新了，而B、C、D三个模块都需要缓存这个信息，那么用户信息更新之后就可以发一条信息到消息队列，B、C、D只要订阅了相关主题，就都可以收到这条信息

2.   数据分析场景，假设一个用户请求进到模块A，这类请求非常重要，需要找3个不同的风控模块B、C、D去处理，3家都认为没问题了，才放行，这时候也可以发一条信息到消息队列，B、C、D只要订阅了相关主题，就都可以收到这条信息



#### 业务代码

我们来看下使用消息队列进行分发前的代码是怎样的：

```java
@PostMapping(value = "/dispatch", consumes = "application/json; charset=utf-8")
public ResponseEntity<String> dispatch(@RequestBody IncrCountReq data) {
    String msg = "to the moon!";
    countService.msgAll("svr1", msg);
    countService2.msgAll("svr2", msg);
    countService3.msgAll("svr3", msg);
    return ResponseEntity.ok();
}

public void msgAll(String svrName, String msg) {
    System.out.println("svr " + svrName + " recevied msg : " + msg);
}
```

svr1、svr2、svr3就可以看作B、C、D三个模块。

收到请求后，svr1、svr2、svr3会打印日志表示请求已经收到

所以我们可以用消息队列进行分发：

```java
@PostMapping(value = "/dispatch_with_mq", consumes = "application/json; charset=utf-8")
public ResponseEntity<String> dispatchWithMQ(@RequestBody IncrCountReq data) {
    String msg = "to the moon!";
    kafkaTemplate.send("tp-mq-dispatch",msg);
    return ResponseEntity.ok();
}
```

对应要有消费者逻辑

```java
@KafkaListener(topics = "tp-mq-dispatch", groupId = "TEST_GROUP1",concurrency = "1", containerFactory = "kafkaManualAckListenerContainerFactory")
public void dispatchForSvr1(ConsumerRecord<?, ?> record, Acknowledgment ack, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
    Optional message = Optional.ofNullable(record.value());
    if (message.isPresent()) {
        Object msg = message.get();
        System.out.println("svr1 收到Kafka消息! Topic:" + topic + ",Message:" + msg);
        try {
            couontSerivce.incrManyTimes(10000);
            ack.acknowledge();
            log.info("Kafka消费成功! Topic:" + topic + ",Message:" + msg);
        } catch (Exception e) {
            e.printStackTrace();
            log.error("Kafka消费失败！Topic:" + topic + ",Message:" + msg, e);
        }
    }
}

@KafkaListener(topics = "tp-mq-dispatch", groupId = "TEST_GROUP2",concurrency = "1", containerFactory = "kafkaManualAckListenerContainerFactory")
public void dispatchForSvr2(ConsumerRecord<?, ?> record, Acknowledgment ack, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
    Optional message = Optional.ofNullable(record.value());
    if (message.isPresent()) {
        Object msg = message.get();
        System.out.println("svr2 收到Kafka消息! Topic:" + topic + ",Message:" + msg);
        try {
            couontSerivce.incrManyTimes(10000);
            ack.acknowledge();
            log.info("Kafka消费成功! Topic:" + topic + ",Message:" + msg);
        } catch (Exception e) {
            e.printStackTrace();
            log.error("Kafka消费失败！Topic:" + topic + ",Message:" + msg, e);
        }
    }
}

@KafkaListener(topics = "tp-mq-dispatch", groupId = "TEST_GROUP3",concurrency = "1", containerFactory = "kafkaManualAckListenerContainerFactory")
public void dispatchForSvr3(ConsumerRecord<?, ?> record, Acknowledgment ack, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
    Optional message = Optional.ofNullable(record.value());
    }
}
```



### 消息队列选型

前面的例子，小王都是用Kafka作为演示，但Kafka不是唯一的选择，实际上市面上消息队列当然非常多，算得上主流的也有5、6个，而大家可能由于对某一种队列比较熟悉，就一直用它，大概就是亚瑟打野、亚瑟上路、亚瑟中路、亚瑟辅助

但你有思考过吗引入的队列是否是最合适的吗？

它与其它队列相比有什么优势吗？

可以说，选型是开发工作中最重要，也是最体现能力的一环。本节就来给大家介绍下消息队列如何抉择



#### 消息队列能力对比

业界比较出名的消息队列有ActiveMQ、RabbitMQ、ZeroMQ、Kafka、MetaMQ、RocketMQ、Pulsar

那大家就会问了，这么多消息队列，我选谁好呢？

别急，我们先来深入理一理消息队列的应用场景，以及每个队列的特色，知道这些信息，才好做出决策

上面有提到几个知名的消息队列，其中ZeroMQ太过轻量，主要用于学习，实际是不会应用到生产，我们就Kafka、RabbitMQ、Pulsar、ActiveMQ、RocketMQ来进行不同维度对比

**一图胜千言**

![img](../img/content_pic/v2-fd9bd66fd7b42f92d8dd119ba6f31580_r.jpg)

PS：贴一张比较详细🔎的对比图

比如你要支持天猫双十一类超大型的秒杀活动，这种一锤子买卖，那管理界面、消息回溯啥的不重要

我们需要看什么？看吞吐量！

所以优先选Kafka和RocketMQ这种更高吞吐的

比如做一个公司的中台，对外提供能力，那可能会有很多主题接入，这时候主题个数又是很重要的考量，像Kafka这样百级的，就不太符合要求，可以根据情况考虑千级的RocketMQ，甚至百万级的RabbitMQ

又比如是一个金融类业务，那么重点考虑的就是稳定性、安全性，分布式部署的Kafka和Rocket就更有优势

**又比如你的延时场景特别多，那么是否天然支持延时消息，也要作为考量标准，这种情况下Kafka实现起来麻烦点**

特别说一下时效性，RabbitMQ以微秒的时效作为招牌，但实际上毫秒和微秒，在绝大多数情况下，都没有感知的区别，加上网络带来的波动，这一点在生产过程中，反而不会作为重要的考量

其它的特性，如消息确认、消息回溯也经常作为考量的场景，管理界面的话试公司而定了，反正现在的大厂，都不看重这个，毕竟都有自己的运维体系



#### 选型的核心

在小王的眼中看来，面对多种的消息队列对其当下的业务场景并不是天差地别的现状，反而在业务场景下，我们更加在乎的是业务开发的能力和速度，更重要的也就是成本💰

*   毫无疑问，作为程序员我们学习组件也是需要学习成本的
*   所以，其实说到底就还是“我熟悉Kafka，所以用它”，但是你得有理有据的分析出来

当团队中的成员对一个组件出现了一定情况下的倾斜，那么我们也就没有必要在进行过多的考虑💭

直接去使用这个消息队列就可以了，不论是Kafka，还是RocketMQ还是其他呢



## 3. Kafka 架构🚙

### 把控全局，掌握整体架构

#### 宏观架构

![image-20250227142636811](../img/content_pic/image-20250227142636811.png)

Producer，很好理解，就是生产者，在Kafka中，Producer负责创建消息并将其发送到Kafka服务器。Producer是消息的源头，它们将消息发送到特定的主题中，以供Consumer订阅和消费

Server，即Kafka服务，可以认为是消息的中转站，因为消息不是从生产者直接发送到消费者的，而是先经过一个中转站存放，就像生活中的菜鸟驿站一样，Kafka的服务端就担任了菜鸟驿站的角色，但跟菜鸟驿站不同的一点是Server会持久化存储信息，不是说消费了就没有了

Consumer，即消费者，是Kafka中的另一个重要角色，它们负责订阅主题并消费其中的消息，当生产者向Server传递了消息之后，如果是消费者订阅了对应的主题，那么消费者就会从Server拉取消息做业务处理

PS：这张图是消息队列抽离出来的核心的模块，并没有进行组件的细分，相对来说是比较的粗糙的



#### 整体架构

Broker：可以理解为机器或者节点吧，也可以理解为就是运行Kafka程序的服务器

Topic：主题是Kafka中的一个核心概念，它是对消息进行分类的一种方式。生产者将消息发送到特定的主题中，而消费者则通过订阅主题来接收相关的消息。但是要注意的是，主题是一个逻辑概念，实际上，一个主题可以被分为多个分区（Partition），以实现消息的并行处理和负载均衡，数据是存储在Partition这个级别的

Partition：分区是Kafka中的一个重要概念，它是主题的物理存储单位。每个分区都是一个有序的、不可变的消息序列，可以被独立地读写。分区在物理上对应一个文件夹及文件夹下面的文件，分区的命名规则为主题名称后接“—”连接符，之后再接分区编号，比如TopicA-1就表示主题A得1号分区，每个分区又可以有一至多个副本（Replica），以提高可用性

![image-20250227142929477](../img/content_pic/image-20250227142929477.png)



### 开门见山，从Topic开始讲起

#### Topic是什么

Topic就是主题，相同业务可以放同一个主题，我们可以类比MySQL，一类数据就放在一张表里，而消息队列中，某类数据就可以放入一个主题，这其实可以看作数据分片的一种方式

比如秒杀消息，就放入秒杀主题，比如短信消息，就放入短信主题，通过主题Kafka实现了业务的隔离，从主题A拿到的消息一定是A对应类型的消息，消费者可以做对应的处理，试想如果各式各样的消息混在一起，处理起来得多乱



#### 在代码中使用Topic

**在业务开发时候，也可以不必提前创建主题，只要向某个主题发送消息，他就自动创建了**

```java
@PostMapping(value = "/decoupling_with_mq", consumes = "application/json; charset=utf-8")
public ResponseEntity<String> decouplingWithMQ(@RequestBody IncrCountReq data) {
    String msg = "coming!!!!!!!!!";
    kafkaTemplate.send("tp-mq-decoupling",msg);
    return ResponseEntity.ok();
}
```

消费的时候也是直接指定tp-mq-decoupling这个主题即可，如下面代码，在注解中制定了topics = "tp-mq-decoupling"，这段代码就会不断去消费tp-mq-decoupling中的信息

```java
@KafkaListener(topics = "tp-mq-decoupling", groupId = "TEST_GROUP",concurrency = "1", containerFactory = "kafkaManualAckListenerContainerFactory")
public void topic_test(ConsumerRecord<?, ?> record, Acknowledgment ack, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
    Optional message = Optional.ofNullable(record.value());
    if (message.isPresent()) {
        Object msg = message.get();
        System.out.println("收到Kafka消息! Topic:" + topic + ",Message:" + msg);​
        try {
            couontSerivce.incrManyTimes(10000000);
            ack.acknowledge();
            log.info("Kafka消费成功! Topic:" + topic + ",Message:" + msg);
        } catch (Exception e) {
            e.printStackTrace();
            log.error("Kafka消费失败！Topic:" + topic + ",Message:" + msg, e);
        }
    }
}
```

这里只是演示了怎么向主题发消息、消费消息这两个最核心的交互，无论是Java/Go的Kafka SDK都是能支持更多的操作，比如我们上面提到的主题创建、主题查询、主题删除，也都是可以在代码中完成的，不过一般而言是不会在业务服务里直接去做的

PS:在业务中去做这些消息队列的相关服务产生的耦合性是比较的高的，也是在后期进行维护是比较不方便的



#### Topic存在哪里

简单描述的话，可以认为topic是存在服务器上的，Kafka把服务器称作Broker，如果是集群环境下，一个topic实际会跨多个Broker

实际上，topic在Kafka里其实是一个逻辑上的概念，也就是架构和逻辑上有主题这个概念，但是实际存储的时候不是以一个主题来，而是将主题划分为分片来存储，也就是说Kafka会将主题分片跨Broker进行存储



### 分而治之，主题分片Partition

#### 分片的好处

通过将Topic进一步划分为Partition，我们实际上收获了如下好处：

1.   提高写入性能，分片使得数据分布在多个Broker上，允许并行处理更多的数据请求，从而提高整体系统的吞吐量

2.   提高消费并发度，因为有多了个分片，那么不同消费者就可以对不同分片进行拉取消费，消费者和分区的关系在后面会单独展开

3.   有了分片，显然后续更容易实现Kafka的水平扩展的能力

4.   一定程度提高了容错性，分片可以提高系统的容错能力。如果一个服务器上的分片发生故障，其他服务器上的分片可以继续处理数据请求，确保系统的高可用性



#### 分片的逻辑结构是怎样的

![image-20250227143901745](../img/content_pic/image-20250227143901745.png)

注意⚠️，同一个Partition里的数据，消息是有序的

即使同一个主题里的消息，如果分布在多个Partition，不同Partition 的消息之间也是无序的，这一点直接从这个结构图里也是能看出的



#### 数据流入哪个分片

一个主题的数据分散成了多个分片，我们就需要有一种方式来决定消息是写入哪个分片，规则如下：

1.   如果指定了Partition，那么就是发送到特定的Partition，**但是一般情况下，业务其实不需要感知Partition**，除非有特殊理由，否则不建议直接指定要发送到哪个Partition；

2.   如果没有指定Partition，**但是指定了一个Key，那么就是根据Key的Hash对Partition数目取模来决定是哪个Partition**，也就是说只要发送时指定了相同的Key，那么相关消息一定会发送到相同的Partition，比如图中我们假设Key是bbb时，Hash取模算出来是1，那么就写入对应的Partition1，如果每条数据都指定Key是bbb，那么这些数据都会流入Partition1；

![image-20250227144036220](../img/content_pic/image-20250227144036220.png)

3.   如果没有指定Partition，也没有指定Key，**那么就采取轮询调度算法，也就是每一次把来自用户的请求轮流分配给Partion**，从第一个开始，直到最后一个，然后又从第一个开始，用我们上图的分片情况来说，就是第一条消息是Partition0，第二条消息是Partition1，第三条消息是Partition2，第四条又轮到Partition0，至此就是打了一圈。



#### 建议创建多少个分片

一个主题，到底多少个分片比较合适？其实没有一个定数，一切按业务实际情况来规划。这里可以提供一个简单的思路：

1.   就默认设置3个分片，大多数业务都是OK的，具体是否有问题，还是经过完善的测试才知道

2.   根据产品预计的写入TPS来估计，比如你需要50000TPS的写入性能，那么先单个分区来测试，看看能达到多少，假设就是10000TPS，那我们来就试试2个分区是否能达到20000TPS，如果可以那么就可以设置5个分片来试试看是否达标，当然这里应该也并不是线性增长，具体还是以测试为准

3.   根据产品预计的消费TPS来估计，假设一个消费者在消费一个分区的情况下性能能达到200/s，但是希望的是20000TPS的消费能力，这里就需要100台消费者才能满足，而对应的，分片也需要扩展到100个来进行支持。

**设置分片的根本思想还是要在业务范围之内更少去创建相应分片，要做到少而高效**



### 坚如磐石，服务器节点Broker

前面我们已经了解了Topic和Partition，知道了信息是逻辑上写入主题，物理上存入Partition，那Partition又是存放在哪里呢？显然，是存放在Kafka的物理节点上，Kafka称之为Broker

#### Broker是什么？

Broker实际就是一个Kafka的服务器节点，服务器节点上运行了Kafka必要的应用程序。Broker提供以下功能：

1.   接收从客户端来的连接

2.   支持客户端查询Kafka集群的信息，比如集群内其它的broker信息

3.   接收来自客户端的读写请求

4.   当然，最重要的，存储消息，也就是说Kafka的消息是存储在Broker上的，也就是存储在服务器本地



#### Broker集群部署

如果是单机部署，那么只有一个Broker，如果是集群模式部署，那么一个Kafka集群下面就存在多个Broker，集群无非就是用多个Broker共同协作对外提供整体的服务

抽象一点来说，无论哪种模式都可以看作一个Kafka集群，单机模式实际就是集群模式下Broker只有一个，其它没有区别

到底是单机部署还是集群模式，还是看具体的业务场景，如果是小规模应用希望短平快，那么用单机是没有问题的，如果是大规模应用，通常还是会多台Broker，无论从性能还是从可靠性而言，都会更有优势，比如Uber在他们的业务中就部署了上百个Broker来处理数据。

在集群中，一个Broker是通过一个唯一的数字ID来标识自己的身份，如下图所示：

![image-20250227144441191](../img/content_pic/image-20250227144441191.png)



#### Broker和Partition的关系

Partition是存放在Broker节点上的，如果单个Broker，很好理解，Partition都在Broker上

如果是多个Broker，则Partition会分布到不同的Broker上，简单来说，一个Partition只对应一个Broker，一个Broker可以存放多个Partition

PS：⚠️如果Broker的数量少于Partition的数量，是会有一些Broker承载同一个topic的多个Partition

![image-20250227144551184](../img/content_pic/image-20250227144551184.png)



#### 客户端如何连接集群

单机时候连接很好做，直接访问单机地址即可，但是集群下有那么多Broker，怎么找到需要的那台呢？这里其实一般有三种解决问题的思路：

第一种是加个代理，由代理来和众Broker打交道；

第二种则是重定向，Redis的集群模式就是重定向的思路，即访问其中一台，如果不是目标节点，它会告诉你正确的节点是哪台；

第三种是客户端先查询路由，客户端再根据路由表去访问。



**Kafka就是第三种方式**，具体而言：

每个Broker都会有其它Broker的信息，也就是说Broker之间是互相知晓的，这是一个大的前提，有了这个前提，客户端怎么连接Kafka集群就呼之欲出了：

1.   访问任意一台Broker

2.   得到所有Broker的信息列表

3.   根据规则连接到具体的Broker，可能同学们会问这个规则是什么，规则就是上一节Partition的规则，由生产者算出来该是哪个Partition，就发送给这个Partition所在的节点



### 辛勤创造，生产者Producer

讲完了Kafka服务端的主题、分片、节点，下面我们来讲讲Producer

Producer即生产者，顾名思义，生产者是生产信息的一方，一般就是某个应用，或者说后端服务，这个服务会发送消息给Kafka服务端，最终消息落到某个主题的某个分片

在实际开发中，这个后端服务会集成Kafka客户端的库来和Kafka打交道，基本上所有的语言，Kafka都有对应的客户端库来支持，比如Java、Go

![image-20250227144815841](../img/content_pic/image-20250227144815841.png)

我们用下面的代码示例来解释：这个例子是当收到一个路由为decoupling_with_mq的HTTP请求，就向Kafka的tp-mq-decoupling主题，发送了一条信息，只要是有发送信息到Kafka服务端这个操作，就是Producer，一般而言发送逻辑是在一个前置一些的业务服务里

```java
@PostMapping(value = "/decoupling_with_mq", consumes = "application/json; charset=utf-8")
public ResponseEntity<String> decouplingWithMQ(@RequestBody IncrCountReq data) {
    String msg = "coming!!!!!!!!!";
    kafkaTemplate.send("tp-mq-decoupling",msg);
    return ResponseEntity.ok();
}
```



#### 生产消息的流程

生产消息看似简单，其实也分了好几步来做。

第一步是构建消息，即将要发送的内容，打包成一个Kafka的消息结构；

第二步是序列化消息为二进制内容，以在网络中传输

第三步是进行分区选择，即计算要发到哪个Partition，发送消息到该Partition对应的Broker



#### 消息结构

![image-20250227145008462](../img/content_pic/image-20250227145008462.png)

*   **Key**. 根据Key的Hash对Partition数目取模来决定是哪个Partition，也就是说只要发送时指定了相同的Key，那么相关消息一定会发送到相同的Partition，Key一般而言都是字符串，最终都会被序列化为二进制
*   **Value**. 发送的具体内容，比如发送的消息是“你好”，Value就是“你好”，Value最终都会被序列化为二进制
*   **Compression Type**. 压缩类型，其实就是压缩算法类型，这个字段决定了用哪种算法压缩Kafka消息，枚举值有none, gzip, lz4, snappy等
*   **Headers**. 可以通过这个字段传递额外的Header，其实就是传递一些自定义的key-value对，比如想传递TraceID，就可以通过这个字段来进行
*   **Partition + Offset**. 这个字段生产出来时候是空的，发送到Kafka的服务端后，会写入具体的分区的偏移，主题+分区+偏移其实就唯一对应了一条消息
*   **Timestamp**. 时间戳，记录消息的时间。

可以看到，所谓消息，最终就是一个封装好的数据结构，Kafka每一条消息都对应了这么一个结构。



#### 序列化

序列化即将消息从常规类型，变成二进制类型，以在网络中传输，以下图为例：

1.   Key对象，会根据Key本身的类型，用不同的序列化工具进行序列化，比如INT就是用INT序列化器，STRING就是STRING序列化器，最终被转化为了二进制数据

2.   Value对象，也是经过序列化，最终被转化为了二进制数据



#### 发送模式

##### 优缺点分析

1.   **同步发送**： 这种方式的优点是确保消息发送成功，调用者可以处理发送失败的情况。缺点是会阻塞调用线程，可能会影响性能。适用于对消息传输可靠性有要求的场景，例如需要确保事务性操作的消息发送成功

2.   **发送即忘**： 这种方式的优点是性能高，调用者不需要等待 Kafka 服务器的响应，但缺点是无法确保消息的可靠传输。通常用于日志记录等对消息传输可靠性要求不高的场景

3.   **异步发送**： 异步发送方式结合了前两者的优点：不阻塞调用线程，同时允许调用者处理发送结果或异常。适用于对消息传输可靠性有要求，同时希望保持高性能的场景

##### 实践场景

*   **同步发送** 方式适用于需要确保消息成功发送的场景，尤其是对数据一致性要求较高的场景
*   **发送即忘** 方式适用于不需要对发送结果进行处理的场景，尤其是对性能要求较高的场景
*   **异步发送** 方式适用于需要在高性能和可靠性之间取得平衡的场景。可以在需要时处理发送失败的情况。

通过选择适合的发送方式，可以在保证系统性能的同时，满足不同业务场景下对消息传递可靠性的要求



#### 消息发送给哪个Broker

Kafka下可能有多个Broker，而一个主题下可能有多个Partition，这些Partition分布在Broker上，那消息是发送给哪个Broker呢？

实际上，我们是先找到一个消息发送给哪个分区，根据分区我们能找到分区所在的Broker，最终是和这个Broker进行交互



### 努力承接，消费者Consumer

#### 消费者工作机制

消费者即读取Kafka消息的应用或者说服务，和生产者一样，消费者也需要集成Kafka客户端库，然后通过接口向Broker去获取消费

![image-20250227145518568](../img/content_pic/image-20250227145518568.png)

1.   不同消费者可以在同一时间对同一主题进行消费

2.   相同消费者可以同一时间从同一主题的不同分片读取信息。

3.   如果一个消费者，同时消费多个分片下，无法保证消息之间的先后顺序

4.   如果一个消费者，只消费一个分片，消费顺序即生产顺序，符合队列的先入先出特性



#### 消息消费是推还是拉

Kafka的消费者使用的拉模式来获取信息，也就是说每次消费者是发消息到Kafka的Broker来获取信息，而不是由Kafka的Broker主动推送

选择拉模式的主要原因还是为了让消费者可以按自身情况来控制消费速度，根据系统资源利用情况（如 CPU、内存等）、业务需要等因素合理拉取消息，避免因消息处理速度不合理带来的资源浪费或过载

我们可以通过调节max.poll.records来调节消费者拉取的频率，这个参数是设置限制每次调用 poll 返回的消息数，如果你的消息处理逻辑较轻量且快速，可以增大 这个值，以提高吞吐量。如果你的消息处理逻辑较复杂且耗时较长，可以减小该值，以减少每次拉取的消息数量，防止处理超时

可能这里就会问了，max.poll.records是每次拉取的个数，但是多久拉取一次呢？实际上，Kafka消费者是循环拉取模式，也就是说当你这批拉取的消息都处理完了，才会去拉取下一批

*   这里有另一个参数max.poll.interval.ms看名字会以为是拉取间隔，其实不是的，这 参数定义了消费者调用轮询方法的最大允许间隔时间（以毫秒为单位）
*   如果消费者在这段时间内没有发起拉取，Kafka 会认为消费者已失效，并触发再平衡操作，将该消费者的分区重新分配给其他消费者

PS：本质上也就是说，消息队列要求我们用多少就去拿多了，而不是喂饭方式的进行推送



#### 消费者OFFSET

每条消息在Kafka中会有Partition ID以及OFFSET，通过这两个信息就可以定位到一条消息。消费者组消费消息之后会提交它在某个Partition对应的OFFSET，这样子下一次就可以从下个位置（OFFSET+1）开始消费

提交的动作可以是自动周期性进行，也就是每个周期会提交最新的已处理消息

比如下图，消费了5这个位置的消息，也做了对应的提交，所以Commited offset也是5，下一次消费的就是6这个位置的消息了

![image-20250227150603599](../img/content_pic/image-20250227150603599.png)

注意，提交操作是和Kafka Broker打交道，所以消费者是不会直接去访问Broker上的topic的，而是通过broker来实现

同时，如果一个指定的offset被确认，那么它之前的信息就相当于都确认了，下次消费是从它的下一条消息开始消费



#### 主动提交和被动提交

上面说到消费者可以自动周期性提交Offset，另一种方式是手动提交，也就是由消费者业务代码自己控制提交时机，主动调用函数来提交

这两种区别主要在于

*   如果自动提交，那么有可能事情还没做完，就提交给Broker“兄弟，我这条消息完事儿了”
*   后面就只能拉到更后面的消息了，如果再发生一些异常，比如消费者在做完事情之前崩溃重启，那这条消息就丢了

手动提交则一般是为了安全考虑，当某条消息的处理流程都ok了，再向Broker主动提交，这样更为稳健。

![image-20250227150839422](../img/content_pic/image-20250227150839422.png)

#### Comsumer Group

除了单纯的Consumer，Kafka还支持消费组的功能。消费组是一个消息队列比较常见的功能，什么是消费组？消费组其实就是把一些消费者组织起来，一同工作，它们像一个团队一样，协同作战



### 拥抱变化，消费组再平衡机制

在 Kafka中，消费者组再平衡是一个关键机制，用于管理和分配主题分区给消费者组中的各个消费者。再平衡过程可以确保数据负载在消费者之间均匀分布，并在消费者加入或离开时自动调整分区的分配

当kafka遇到如下三种情况的时候，kafka会触发Rebalance机制：

1.   新消费者加入：当一个新的消费者加入消费者组时，Kafka需要重新分配分区，以包括新的消费者

2.   消费者离开：当一个消费者离开（无论是正常关闭还是崩溃）时，需要重新分配该消费者负责的分区给其他消费者

3.   主题分区变化：当主题的分区数量发生变化时（例如，增加新的分区），Kafka需要重新分配这些分区

![image-20250227151127199](../img/content_pic/image-20250227151127199.png)



#### 再平衡过程的步骤

1.   暂停消费：在再平衡过程中，消费者会暂停对消息的消费，以防止在重新分配期间发生数据丢失或重复。

2.   触发再平衡：由消费者组协调器（通常是Kafka集群中的一个Broker）触发再平衡。

3.   分配分区：消费者配合协调器根据当前消费者组的成员重新分配主题的分区。

4.   消费者完成分工：重新分配完成后，所有消费者会从协调器拿到新的分配情况。

5.   恢复消费：消费者收到新的分配后，恢复消费，开始处理被分配到的新分区。



#### 策略分类

从再平衡的视角，这几种分区策略大的来说其实可以分为两个“阵营”，一个叫Eager Rebalance，一个叫Incremental Rebalance



#### **再平衡的影响**

从上面讲述中，我们可以看到再平衡可以说是针对集群变化的自动调节机制，要注意的事，频繁触发再平衡是会带来一些影响的：

1.   重复消费，如果某个消费者离开消费组时还没来得及提交Offset，当再平衡之后，接盘对应分区的消费者就会重复消费，浪费资源

2.   性能变差，上面介绍了再平衡是需要相对复杂的流程去实施的，在实施再平衡的这个过程中，消费速度也会受到影响

**PS：消费者组再平衡是一个关键机制，用于管理和分配主题分区给消费者组中的各个消费者。再平衡过程可以确保数据负载在消费者之间均匀分布，并在消费者加入或离开时自动调整分区的分配**



## 4. Kafka实践经验🚌

### 消费语义

#### 消费语义介绍

对于消息，一般有如下几种消费模式

at most once，即最多一次语义：消息可能会丢失，但绝不会重复入队，其适用于对消息传递可靠性要求不高的场景，如日志记录

![image-20250227151658597](../img/content_pic/image-20250227151658597.png)

at least once，至少一次语义：消息不会丢失，但有可能被重复发送处理，其适用于对消息传递可靠性有要求，但可以容忍消息重复的场景，如事件通知

![image-20250227151727700](../img/content_pic/image-20250227151727700.png)

exactly once，精确一次语义，消息不会丢失，也不会被重复发送，其适用于关键业务场景，需要严格保证消息处理一次且仅一次，如金融交易处理

![image-20250227151752334](../img/content_pic/image-20250227151752334.png)

回到我们一开始的目标来分析：

如果要保证消息不丢失，at least once和exactly once 这两种语义可以达标

如果要保证消息不重复消费，则at most once和exactly once 这两种语义可以达标



#### 消息队列消费语义

消息队列一般实现得都是at least once语意，也就是至少能消费一次，比如Kafka就是如此，也就是只要消息进入了Kafka，那么你是很容易去实现at least once的能力的，但是要考虑被重复发送的可能性，下一节我们会重点讲到底如何保证消息不丢失

PS：Kafka 要求实现精确一次实际上是十分困困难的

1.   **系统故障和网络问题**：分布式系统中，Broker、生产者和消费者之间的通信可能会受到网络延迟、中断或系统故障等等异常情况的影响。这些问题可能导致消息重复发送、接收或处理

2.   **并发处理**：Kafka支持高并发处理，多个消费者可以同时消费同一个主题的消息。在并发环境中，确保每条消息只被处理一次需要复杂的协调和同步机制

3.   **消费者处理逻辑**：消费者在处理消息时可能会出现异常或错误，导致消息处理失败。如果消费者没有正确处理这些情况（例如，没有提交偏移量或没有重试机制），那么消息可能会被**重复**处理



### 如何保证消息不丢失

消息队列作为消息传递的中枢，承担着不同业务的消息数据，这些消息如果在链路中丢失了，可能会带来严重的影响，所以消息队列需要保证消息不丢失

大家回顾一下上一节我们介绍的消费语义，并思考哪一种消费语义，就能满足我们不丢失的诉求。显然，是at least once，即最少一次语义，消息一定不丢，但是有可能重复

**消息丢失的存在可能性的环节**

1.   生产环节

2.   存储环节

3.   消费环节

![

](../img/content_pic/image-20250227152055042.png)

#### 生产环节

消息生产环节，也就是生产端把消息发到Broker这个环节，先说结论，这个环节跟Kafka这个应用关系不大，毕竟发消息是在Kafka客户端，所以Kafka很难保证完全可靠，唯一能做的一点就是发送消息之后必须得到响应，不然就反复重试

![image-20250227152204990](../img/content_pic/image-20250227152204990.png)



#### 存储环节

存储数据不丢失，也就是进去消息队列之后的数据，是持久的，Kafka这种消息队列，是非常可靠的，只要写入了队列，就不会丢消息，这个依托于**持久化存储**：Kafka的消息确认机制还依赖于其持久化存储能力。一旦消息被写入并确认（根据所选的确认级别），它就会被持久化存储到磁盘中。这意味着即使系统发生故障或重启，已经确认的消息也不会丢失。它就可以被消费者至少消费一次

![image-20250227152252156](../img/content_pic/image-20250227152252156.png)



#### 消费环节

Kafka提供了偏移量管理功能：Kafka消费者通过提交每个分区的偏移量来跟踪已经消费的消息，即使消费者在处理消息时发生故障，重新启动后它仍然可以从最后一个提交的偏移量处继续消费，确保消息至少被处理一次

相比于自动提交，另一种方式是手动提交，也就是由消费者业务代码自己控制提交时机，主动调用函数来提交

简单来说，为了保证消费最终被处理过，只有在消费端处理成功之后，才提交偏移到Broker，否则不进行偏移提交，这样下次拉取还能拉取到这条消息

这种模式下，即使发生消费者宕机，重启恢复之后也不会发生消息丢失，其本质就类似于平常我们去餐厅吃饭，吃满意之后再付钱，要是饭菜有问题，就不付钱



### 如何让消息不重复

#### 幂等性生产

Kafka 的幂等性生产是指在相同的Producer实例中，同一条消息（相同的消息内容和唯一的消息 ID）即使被多次发送到 Kafka 也只会被写入一次。这是为了防止因网络问题、重试等原因导致的消息重复

##### 幂等性生产的工作原理

Kafka 的幂等性生产通过以下几个关键机制来实现：

1.   **Producer ID (PID)：**Kafka 为每个生产者实例分配一个唯一的 Producer ID。这个 ID 在整个生产者生命周期内保持不变，用于标识该生产者，以区分不同的生产者实例

2.   **Sequence Number：**对于每个 Topic Partition，Kafka生产者为每条消息分配一个递增的序列号。Kafka 该序列号是递增的，表示消息的顺序，Broker 会跟踪每个 Topic Partition 的最后一个已提交的序列号

当 Kafka 接收到消息时，会检查这个序列号，以确保同一条消息不会被写入多次

3.   **消息去重：**当生产者发送消息时，Broker 会检查消息的序列号是否在对应分区已经处理过，具体而言就是Kafka针对每条接收到的消息，都会检查它的序列号是否比Broker所维护的值严格+1，只有这样才是合法的，其他情况都会丢弃，从而实现幂等性

![image-20250227152534018](../img/content_pic/image-20250227152534018.png)



#### 幂等性消费

Kafka是没办法解决重复消费的问题，我们只能引入别的机制来解决了，也就是可重入消费，换句话说就是幂等性消费

PS：这里要着重理解下，幂等性消费和Kafka其实没有太大关系，实际是业务通用手段，**下面小王给大家介绍一下Redis、MySQL中的幂等处理方法，这两个组件也是业务消费阶段最常打交道的，理解了它们的幂等手段**，也就基本理解了幂等性是怎么玩的

##### 如果存储是Redis，如何进行幂等处理

1.   **唯一标识符**：为每个消息分配一个全局唯一的标识符（如UUID）。

2.   **Redis Set**：将已消费的消息ID存储在Redis的Set数据结构中。每次消费消息前，检查该消息ID是否已存在于Set中。

3.   **原子操作**：使用Redis的原子操作（如SISMEMBER和SADD）来检查和添加消息ID，确保操作的原子性。

##### 如果存储用MySQL，如何进行幂等处理

MySQL常见实现幂等性的思路有如下三种：

1.   **唯一约束**：在MySQL表中为消息ID创建一个唯一约束

2.   **INSERT IGNORE**：使用 INSERT IGNORE 或 ON DUPLICATE KEY UPDATE 语句来尝试插入消息记录。如果消息ID已存在，则忽略或更新该记录

3.   **事务**：在需要的情况下，使用事务来确保多个操作的原子性



#### 流量优化

如果业务是用MySQL做存储，那就可以参考上面MySQL幂等处理的思路，另外这里其实有个小的优化点，如果重复请求过多，那么MySQL凭白无故会多承担这部分压力，而MySQL这个数据库的性能是比较宝贵的，所以可以加一层Redis过滤来优化：

简单来说，在Redis中缓存已经处理过的唯一Key，压力到MySQL之前，先做一次检查，如果存在于Redis，那么就不用到MySQL了，如果不存在，请求就继续打到MySQL，依赖MySQL的幂等做最后兜底

![image-20250227152902978](../img/content_pic/image-20250227152902978.png)



### 如何让消息有序

**常见的支付业务的老大难☹️**

![image-20250227153107741](../img/content_pic/image-20250227153107741.png)

Kafka一个主题的全局可以看作是无序的，因为有很多不同Partition用于存储，但是在同一个Partition的消息显然是有序的

所以如果我们希望业务上消息有序，那么就需要在Partition的路由上动手脚



#### 简单粗暴

一种最简单的做法，就是根据业务确定分区，即每类业务自己一个分区，这样就可以实现业务消息有序

具体而言，即将业务所有消息都指定同一个分区Key，这样一来所有消息都会添加至同一个Partition，这样就达到了我们的目的，比如秒杀业务像下面这样向tp-seckill这个Topic发送消息，都用分区Key：“aaabbbccc”来发送

潜在的不足之处在于这样做性能的扩展性就低了很多，当单个业务增长比较快，最后压力都给到了同一个Partition，无法发挥多Partition的优势，所以一般而言还会根据情况进一步地业务内分区

#### 业务内分区

我们前面说了，可以根据业务分区，而如果单个业务压力过大，我们就要考虑业务内再次切分

这里可以类比一下MySQL的分表，其实会发现差不多，本质都是将集合进一步做切片，以寻求更大的并发能力和吞吐量

下面我们就讲一下消息队列怎么以分表的思路做分区

#### 分区思路

*   子业务分区
*   客户分区
*   大小客户分区

PS：总的来说不管是怎么样的分区思路都要去结合我们的业务场景来去进行的



### 消息积压怎么办

#### 三板斧：扩容、降级、排查异常

消息积压即消息太多，短时间内处理不过来了，比如你的消费端处理速度是100/s，但是现在消息队列里已经累计了1000万条数据待消费，那么需要10万秒才能消费完，相当于要1天多，在很多业务场景里，这就算是积压了

#### 监控告警

通过监控要能自动发现积压，第一时间感知到，比如通过定时服务监测Kafka的队列信息，通过队列信息计算积压情况



#### 异常消息导致的阻塞

如果是顺序消费场景，是依赖每条消息处理成功的，如果某条消息是有问题的，那就会一直堵在这里，就像被放毒了一样

至于具体是什么问题，这就千奇百怪了，可能是交易依赖某个资源不足，可能是代码存在什么特殊的bug，刚好这笔交易的某个数值触发了这个bug，需要消费服务升级才能解决

这种异常是直接卡死了整个消息队列，影响比较严重，此时就需要尽快介入，升级消费端代码，将这笔消息合理地处理掉



#### 非核心模块拖后腿

如果消费链路上还依赖了不那么核心的业务，因为这些业务拉慢了消费速度，在积压情况下，就可以先进行系统降级，也就是砍掉相关逻辑，加快数据消费

举个例子，我们是一个秒杀消费场景，秒杀消费链路中有个数据统计上报，这个功能并不是核心业务，在需要更高性能时候可以给这个功能停掉，这就要求代码里是具备了对应的开关功能的，可以快速降级



#### 压力超过可承载范围

*   **快速加资源扩容：**加钱～～～
*   **设置中间消费者：**放置在真正的消费者和kafka之间，中间消费者不处理消费逻辑，仅仅只是提交offset，同时保证将消息保存到别的地方，比如内存，磁盘，数据库，Redis，其它kafka。这样可以一定程度缓解kafka存储的积压， 注意只是缓解，争取到了一些解决问题的时间，还是得想办法提高消费速度
*   **保新：**如果业务允许，其实可以选择保新，即新消息导入到新的消息队列，这样新消息可以得到及时处理，而旧消息，就等1小时之后慢慢消耗掉即可



## 5. 高可用🚎

### 多副本机制介绍

Kafka受欢迎有一个很大的原因是它天然提供了容灾解决方案，可以应对机器故障等各种异常，这些异常我们很多是无法预防的，比如机房断电，机器硬盘损坏，甚至之前出现过的天津机房爆炸事故

Kafka是通过副本机制来实现容灾，这种机制下即使发生了一定的异常，也可以保证系统正常运作和数据准确性，扩展来说，有了多副本，我们就有如下优势：

1.   高可用性，如果 Leader 副本所在的 Broker 宕机，Kafka 会自动从其它副本中选取一个新的 Leader，确保服务的持续性，具体选择规则我们后面会介绍。

2.   容灾，即使部分副本数据丢失，只要有一个副本是完整的，数据就不会丢失，简单来说就是多备份情况下数据丢失风险变小。

3.   读性能提升，默认情况下，虽然数据的多个副本可以分布在不同的 broker 上，但是Kafka都是Leader提供读写，如果特定业务需要，也可以让消费者从Follower上读数据，增加读的并发度。

#### Kafka副本概念

要学习Kafka多副本机制，我们得先熟悉一下Kafka副本机制的几个概念：

*   Replica：Replica是指Kafka集群中的一个副本，它可以是Leader副本或者Follower副本的一种。每个分区都有多个副本，其中一个是Leader副本，其余的是Follower副本。每个副本都保存了分区的完整数据，以保证数据的可靠性和高可用性
*   Leader：Leader是指Kafka集群中的一个分区副本，它负责处理该分区的所有读写请求。Leader副本是唯一可以自主向分区写入数据的副本，它将写入的数据都会同步到所有的Follower副本中，以保证数据的可靠性和一致性
*   Follower：Follower是指Kafka集群中的一个分区副本，Follower副本不能直接向分区写入数据，它只能从Leader副本中复制数据，并将数据同步到本地的副本中，以保证数据的可靠性和一致性。在Leader副本挂掉的时候，Follower副本有机会被选举为新的leader副本从而保证分区的可用性

![image-20250227154421847](../img/content_pic/image-20250227154421847.png)

这里要注意的一个关键点：副本机制意味着每次数据写入，数据不只是写入一台Broker，最终还会同步到其它Broker作为副本备份



#### 如何创建多副本

副本个数是在主题创建时指定，如果是开发或者测试环境，可以只指定副本数量为1，此时意味着它没有备份。如果是生产环境，一般而言都是设置3个副本或者更多，这样可以实现容灾切换

‼️**分区的副本数必须小于等于Broker数量**



### 多副本下的写入机制

#### 副本写入机制

Kafka的做法是选择其中一个副本作为Leader，Leader就相当于这个副本集合对外的代表，剩余的副本就是数据的备份。对于生产者而言，它只用和Leader打交道，Leader再和其它副本进行数据同步

![image-20250227154846207](../img/content_pic/image-20250227154846207.png)


那写入Leader之后，就算写入成功吗，换句话说就是Leader多久回包，是等数据同步完成，还是Leader自己完成写入就回？​

这里我们需要再看下之前章节介绍过下的写入机制，这个机器是由生产者侧的acks配置决定的，不同写入策略的答案是不一样的 

![image-20250227155004695](../img/content_pic/image-20250227155004695.png)

可以看到，我们只要选择写入策略是all，那么就可以保证进入Kafka的存储数据是基本不会丢失的，因为一个副本挂掉之后，这也是Kafka的可靠性所在

选择all的可靠性虽然会很高，但是你有没有想过一个问题，假设策略是all，是不是任何一个副本对应的机器，只要挂掉，就无法写入了，举个极端点的例子，一个Kafka集群有1024台机器，如果1台出问题了，整个集群就不可用了，这会不会太严苛了？

实际上，这里的“所有副本”是有条件的，所有是指跟上节奏，在ISR集合里的副本，跟不上节奏的副本就会被剔除在外，这样在保证可靠性的同时，也有一定的容错性



#### ISR机制

1.   AR（Assigned Replicas）：AR是指分区的所有副本，包括Leader副本和Follower副本，也就是整体的集合

2.   ISR（In-Sync Replicas）：ISR是指与Leader副本保持同步的副本集合。ISR中的所有副本与Leader副本保持同步（注意，Leader副本本身也属于ISR集合），即它们已经复制了Leader副本中的所有数据，并且与Leader副本之间的数据差异不超过一定的阈值(Follower副本能够落后Leader副本的最长时间间隔)。并且ISR副本集合是动态变化的，不是一成不变的。除非开启了Unclean选举，不然只有处于ISR中的副本才有可能被选举为新的Leader副本，以保证分区的正常运行

3.   OSR（Out-of-Sync Replicas）：OSR是指与Leader副本不同步的副本集合。OSR中的副本与Leader副本之间的数据差异超过了一定的阈值，或者它们还没有复制Leader副本中的所有数据。除非开启了Unclean选举，否则OSR中的副本不能被选举为新的Leader副本。简单来说，OSR集合 = AR集合-ISR集合

![image-20250227155335725](../img/content_pic/image-20250227155335725.png)

简单总结一下，ISR其实就是跟上节奏的副本，也可以直接看作生效的副本。这个生效状态是随时变化的：

每个Partition都会由Leader 动态维护一个与自己基本保持同步的ISR列表。所谓动态维护，就是说如果一个Follower比一个Leader落后超过了给定阈值，默认是10s，则Leader会将其从ISR中移除。如果OSR列表内的Follower副本重新追上了Leader副本的进度，那么就将其添加到ISR列表当中

当Leader挂掉，Kafka就会从ISR列表中选择第一个副本升级为Leader

**数据是直接往Leader写入，写入之后Leader和Follower之间会进行同步，是否要等待同步完成取决于选择哪种写入策略**



### 副本同步机制

前面说到，有了副本之后，就可以将一份数据，备份到不同机器上，即使部分机器出现问题，数据也能找回来，也就多了可靠性和容灾性

#### 数据同步初体验

你可能会认为，数据是先写入Kafka Leader，再由Leader往Follower里写，其实不是的，在Kafka中，是Follower主动拉取Leader的数据进行同步

PS：小王认为在Kafka以及其他的消息队列当中的Follower主动拉取Leader的数据，也就是去主动获取这个动作就是消息队列的特殊点

*   数据是先写入到Leader副本，同步时候是Follower副本去主动拉取消息，拉的优势在于副本机器可以根据自身的负载情况来拉取



#### 怎么拉取数据

首先，不可能拉所有数据，不然每次拉取的成本太高，一定是根据某个偏移来拉，这里就要引入LEO的概念：

LEO是指下一条要写入的位置，根据LEO，Leader就知道某个Follower数据同步到哪里了

根据所有ISR副本的LEO，实际就能知道目前数据的同步情况，在所有ISR副本中都同步的数据，才算是真正落地的数据，是不是描述起来比较绕？所以Kafka抽象了一个叫HW的概念来表示这些真正落地的数据

#### 对外展示

![image-20250227163159506](../img/content_pic/image-20250227163159506.png)

每个Partition都会由Leader 动态维护一个与自己基本保持同步的ISR列表。所谓动态维护，就是说如果一个Follower比一个Leader落后超过了给定阈值，默认是10s，则Leader将其从ISR中移除。如果OSR列表内的Follower副本与Leader副本保持了同步，那么就将其添加到ISR列表当中



## 6. Kafka高性能🏎️

### 高性能秘诀-多层次

Kafka本质是数组，数组的优势在于存储连续，方便索引，如果顺序写入性能会很高

但是如果光是一个数组，随着数据越积越多，单一磁盘存放越来越吃力，造成I/O压力过大

所以Kafka不仅仅是一个数组，实际上，Kafka充分利用分治的思想，将这一个抽象的大数组，划分为很多个小数组



#### Kafka多层划分

首先是Topic划分，不同的Topic可以看作不同的小数组，这些小数组可以分别存放在不同的Broker上

其次，每个Topic还做了切分，分为了多个Partition，也就是说把一个主题可以划分为多个主题分片

![image-20250227170147601](../img/content_pic/image-20250227170147601.png)

最后，每个Partition还有做进一步拆分，一个Partition实际对应了多个不同的文件，这些文件是分离开来的。分为：

.log文件，即消息本身，记录了数据

.timeindex文件，时间索引，即可以通过时间对.log文件做索引查询

.index文件，即偏移量索引，即可以通过偏移量对.log文件做索引查询

显然，.log就是数据，其它两个文件是不同维度快速定位数据的索引

这样查找的时候，就不是在.log文件直接找，而是先去查找.index或.timeindex这两个文件，这两个文件是要加载到内核内存的，所以不能太多



#### Partition文件细节

最后如果某个Topic的某个Partition，因为消息非常多，Partition对应的3个文件不最终也会不堪重负吗？是的，所以Kafka实际还做了进一步分片：按大小滚动，单个文件达到阈值就分裂出一个新的文件继续写，这种按大小滚动分片的思路在MySQL中分表中也经常见到

Partition数据拆分成的多个小文件叫segment，每个segment的大小可以通过log.segment.size配置，默认是1GB，也就是说每1GB，滚动分片一次

注意，每个小文件也有自己的数据文件和索引文件，索引文件包含偏移索引和时间索引

#### 查找的过程

![image-20250227170434559](../img/content_pic/image-20250227170434559.png)

分层设计其实就是出自分治思考，对于Kafka而言，所有消息写入一个文件，那肯定扛不住，所以提出了Topic的概念，可以一个业务写入一个Topic，单个Topic不具备扩展性，扛不住大流量业务，所以Topic又进行了分片，也就是Partition，一个业务的消息可以根据规则写入多个Partition，单个Partition是不是也需要能扩展，于是一个Partition又可以切分为多个segment文件，segment文件支持按需滚动增长，所以Partition就具备了扩展性。这就是Kafka一以贯之的分层设计



最后，我们一定要能理解分治的目的：

1.   解决单个分片过大的存储管理问题，小文件显然比大文件好管理；

2.   从写入同一个文件，变为写入多个文件，提高并发和吞吐，解决性能问题



### 高性能秘诀-顺序写

前面有讲过Kafka写入数据其实最终就是添加到每个Partition末端，也就是写入对应的磁盘文件里，这种设计手段简单高效，非常巧妙，接下来由小王来去介绍一下相关的机制

#### 数据落地思路

为了实现数据可靠，一般有两种思路：

*   一种是直接写入磁盘，直接写磁盘很容易实现了数据可靠，缺点是性能很差；
*   另一种常见的思路是先写入程序内存，后续再寻求持久化。这种思路写入之后需要有完善复杂的机制同步到磁盘，增加很高的复杂性

那怎么办呢，到底是要高性能还是要低复杂度？其实有一种两者兼顾的手段：顺序写磁盘



#### 顺序写磁盘

我们都知道内存写入通常远快于磁盘写入，但是也有例外，也就是磁盘顺序写入的话，性能和内存差距并不会太大，所以落盘场景是可以考虑磁盘顺序写的

同时，用顺序写磁盘的模式，Kafka的文件结构会非常简单清晰

基于兼顾复杂度和性能的考虑，Kafka的写入模式专门设计成了顺序写入，这里要注意一点，写磁盘也不一定是直接刷盘的，只是说提交给了操作系统，这里还是有丢失数据的可能性，只是相对于先写Kafka应用程序内存，已经是减少了一个可能遗失的环节了，当然后面小节我们也会提到相关机制，这里稍微了解下即可

简单总结一下，顺序写有如下优势：

1.   **高效的磁盘利用**：
     *   磁盘的顺序写入性能通常远远高于随机写入性能，这使得 Kafka 能够实现高吞吐量

2.   **简单的存储管理**：
     *   顺序写入简化了日志段的管理和消息的追加操作
     *   日志文件按顺序组织，便于快速查找和读取消息

3.   **可靠性和一致性**：
     *   顺序写入有助于确保消息的可靠性，因为消息一旦写入日志文件，不会被修改
     *   消费者可以通过偏移量准确地读取消息，确保消息处理的顺序和一致性

讲到这里，大家肯定有一个疑问，为啥顺序写磁盘就能这么快？什么原理？抱着知其然也要知所以然的态度，下面我们对其进行分析



#### 顺序写入为什么快

一般而言写磁盘的性能会远远低于操作内存，但是顺序写入则不一样，顺序写入的性能通常而言可以高出随机写入3个以上的数量级，甚至接近内存写入

为什么顺序写入性能会这么高？为了解决这个问题，我们需要先理解写入磁盘具体是做什么？

我们可以简单一点把写入磁盘分为两步：1.寻址；2.数据传输，寻址需要磁头转动，是机械操作，是主要耗时的地方，而随机写入，就得每一次都去寻址，这就意味着每一次都需要机械活动，自然就非常慢，所以从磁盘的视角来看，它是很讨厌随机写入的

有个简单理解其实就差不多了，如果想更深入一点理解，可以把磁盘写入拆得更细致：

1.   磁头沿着半径机械移动，最终移动到数据所在的磁柱

2.   盘片旋转，是磁盘对齐数据所在扇区

3.   数据传输，也就是写入数据



### 高性能秘诀-页缓存

顺序写磁盘的速度已经很快了，顺序写内存的话就更快，Kafka利用操作系统自带的Page Cache，来实现一定程度顺序读写内存

Page Cache可以简单看作热点磁盘数据的内存缓存，当消息写入时，是先写入Page Cache，后面由操作系统将其刷入磁盘，这样性能就会提升很多

![image-20250227171052277](../img/content_pic/image-20250227171052277.png)

同时，如果查询时候发现PageCache中有对应数据，那么也就不用去磁盘读取，这样读取性能也会有很大的提升

![image-20250227171115812](../img/content_pic/image-20250227171115812.png)

值得一提的是，Kafka是生产消费者模式，即生产了消息，在无积压情况下，这个消息很快就会被消费，也就是说我们生产消费时写入了Page Cache，而很快就有消费者来触发Kafka应用程序读取对应数据，而这个时间间隔很短，PageCache命中的可能性会很高

#### Page Cache数据和磁盘同步

数据写入Page Cache之后，是需要和磁盘同步的，这是因为如果电脑断电或者重启，这部分数据就会丢失。数据同步有几个时机：

1.   当空间内存不够用了，也就是说低于某个阈值时，此时将Page Cache刷入并释放Page Cache

2.   当脏页在内存驻留时间超过一个阈值时
3.   用户主动调用刷脏系统调用sync()和fsync()



### 高性能秘诀-零拷贝

我们知道消息是存储在Kafka服务器，消费者消费消息时，数据要从Kafka服务端传递给消费者，具体一点来说当有Consumer订阅主题，数据需要从磁盘读取并将数据写入网络套接字，然后在网络中进行传输，这个操作看似不复杂，但如果不很好的设计传输流程，它的效率会非常低

下面我们先讲一下常规传输方式为何低效，然后会展开讲解Kafka是如何通过零拷贝技术进行优化的

#### 常规传输为何低效

![image-20250227171321838](../img/content_pic/image-20250227171321838.png)

##### 2次系统调用

一次是 read() ，一次是 write()，每次系统调用都得先从用户态切换到内核态，等内核完成任务后，再从内核态切换回用户态，所以共发生了 4 次用户态与内核态的上下文切换

上下文切换到成本并不小，一次切换需要耗时几十纳秒到几微秒，虽然时间看上去很短，但是在高并发的场景下，这类时间容易被累积和放大，从而影响系统的性能

##### 4次数据拷贝

还发生了 4 次数据拷贝，其中两次是 DMA 的拷贝，另外两次则是通过 CPU 拷贝的

PS：DMA（Direct Memory Access)，即直接内存访问，核心就是CPU 不再参与「将数据从磁盘控制器缓冲区搬运到内核空间」的工作，这部分工作全程由 DMA 完成



#### 优化思路

*   减少系统调用次数
*   减少数据拷贝次数

#### 零拷贝技术

所谓的零拷贝是指将数据在内核空间直接从磁盘文件复制到网卡中，而不需要经由用户态的应用程序之手。这样既可以提高数据读取的性能，也能减少核心态和用户态之间的上下文切换，提高数据传输效率

![image-20250227171559712](../img/content_pic/image-20250227171559712.png)

Kafka 就利用了「零拷贝」技术，从而大幅提升了 I/O 的吞吐率，这也是 Kafka 在处理海量数据为什么这么快的原因之一



### 高性能秘诀-批量操作

利用底层的技术外，Kafka还在应用程序层面提供了一些手段来提升性能，其中一个就是批量操作

#### 批量生产

批量生产就是，很多时候我们其实也不会去追求瞬时发送，所以这里有一个潜在的优化方向就是批量发送

#### 批量消费

批量消费是指一次性拉多条消息进行消费，这样可以节约网络开销和带宽

PS：Kafka主要有2个批量操作的地方，一个是批量生产，也就是批量发送，其实就是通过发送缓冲，将数据缓冲起来，等聚集了一批数据，再一次性发送给Broker。另一个是批量消费，本质就是一次多拉几条消息，一起消费。要注意，批量生产和批量消费不是成对关系的，是相互独立的优化手段



### 高性能秘诀-数据压缩

生产者通常发送基于文本的数据，例如 JSON 数据。在这种情况下，对生产者应用压缩非常重要。**如果开启了压缩**，**生产者消息以压缩的方式发送**，待消费时再解压**，**Kafka 支持两种类型的压缩，producer端和broker端

通过启用压缩，可以减少网络利用率和存储，这通常是向 Kafka 发送消息时的瓶颈。压缩批次具有以下优点：

*   生产者请求的大小要小得多，通常压缩之后的数据比压缩前小3倍以上

*   因为数据变小了，通过网络传输数据的速度更快 ，即延迟更短，同时也拥有了更好的吞吐量

* 因为数据变小了，那么在磁盘上存储的消息也变小了，Kafka 中的磁盘利用率更高



#### 何时需要压缩

如果你是追求高性能的服务，那么正常来说，都是需要开启压缩的。

软件领域没有银弹，数据压缩也是有代价的，它会付出额外的CPU，你需要有这么一个判断：压缩带来的磁盘、带宽节省的收益，是大于CPU一定程度的损失的



#### 在哪个环节进行压缩

其实压缩既可以在生产者Producer那一侧进行，也可以在服务节点Broker那一侧进行



#### 压缩算法对比

目前 Kafka 共支持四种主要的压缩类型：Gzip、Snappy、Lz4 和 Zstd。关于这几种压缩的特性

其实Gzip我们可能是平常工作生活中打交道是最多的，它的缺点在于CPU高、速度又不是很快

Snappy是Google的作品，性能非常棒，也没有什么明显的缺点，各方面都还可以

Lz4特点在于速度非常快，但是缺点是压缩比率很低，也就是快是快，但是压缩不够到位

Zstd是 Facebook开源的压缩算法，压缩率和压缩速度都还可以，和Snappy一样比较能打，直到 Kafka 的 2.1.0 版本才引入支持



## 下次见💫

那么小王今天的万字详解就分享到这里～

**我们下次见！**🍟
