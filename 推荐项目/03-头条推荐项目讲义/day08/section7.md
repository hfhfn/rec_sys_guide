# 8.9 WDL模型导出

## 学习目标

- 目标
  - 无
- 应用
  - 无

### 8.9.1 线上预估

线上流量是模型效果的试金石。离线训练好的模型只有参与到线上真实流量预估，才能发挥其价值。在演化的过程中，适应TFserving，提高了模型迭代的效率。

**基于TF Serving的模型服务**

TF Serving是TensorFlow官方提供的一套用于在线实时预估的框架。它的突出优点是：和TensorFlow无缝链接，具有很好的扩展性。使用TF serving可以快速支持RNN、LSTM、GAN等多种网络结构，而不需要额外开发代码。这非常有利于我们模型快速实验和迭代。

### 8.9.2 SavedModel

* 目的：导出savedmodel的模型格式

TensorFlow的模型格式有很多种，针对不同场景可以使用不同的格式，只要符合规范的模型都可以轻易部署到在线服务或移动设备上，这里简单列举一下。

- Checkpoint： 用于保存模型的权重，主要用于模型训练过程中参数的备份和模型训练热启动。
  - **所以只给 checkpoint 模型不提供代码是无法重新构建计算图的，需要运行代码加载模型训练或者测试**
- SavedModel：使用saved_model接口导出的模型文件，包含模型Graph和checkpoint可直接用于上线，TensorFlowestimator和Keras模型推荐使用这种模型格式。
  - **GraphDef(\*.pb)**：这种格式文件包含 protobuf 对象序列化后的数据，包含了计算图，可以从中得到所有运算符（operators）的细节，也包含张量（tensors）和 Variables 定义，但不包含 Variable 的值，因此只能从中恢复计算图，但一些训练的权值仍需要从 checkpoint 中恢复。

* 实现：
  * 1、指定指定serving模型的输入特征列类型，用于预测时候输入的列的类型指定

    * 模型输入的特征列指定：columns

  * 2、定义模型服务接受的数据格式输入函数

    * fn = tf.estimator.export.build_parsing_serving_input_receiver_fn(feature_spec)

    * feature_spec:指定模型的特征列输入函数以及example，用于预测的时候输入的整体数据格式

    * tf.feature_column.make_parse_example_spec(columns)：Creates parsing spec dictionary from input feature_columns.

      * 会基于提供的特征列类型，生成一个用于解析的字典

      * ```python
        # 比如说生成这样的
        {
            "feature_a": parsing_ops.VarLenFeature(tf.string),
            "feature_b": parsing_ops.FixedLenFeature([1], dtype=tf.float32),
            "feature_c": parsing_ops.FixedLenFeature([1], dtype=tf.float32)
        }
        ```

导出代码：

```python
# 定义导出模型的输入特征列
wide_columns = [tf.feature_column.categorical_column_with_identity('channel_id', num_buckets=25)]
deep_columns = [tf.feature_column.embedding_column(tf.feature_column.categorical_column_with_identity('channel_id', num_buckets=25), dimension=25),
                tf.feature_column.numeric_column('vector'),
                tf.feature_column.numeric_column('user_weights'),
                tf.feature_column.numeric_column('article_weights')
                ]

columns = wide_columns + deep_columns
# 模型的特征列输入函数指定，按照example构造
feature_spec = tf.feature_column.make_parse_example_spec(columns)
serving_input_receiver_fn = tf.estimator.export.build_parsing_serving_input_receiver_fn(feature_spec)
estimator.export_savedmodel("./serving_model/wdl/", serving_input_receiver_fn)
```