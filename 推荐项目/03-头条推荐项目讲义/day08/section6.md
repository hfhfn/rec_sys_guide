# 8.5 排序模型进阶-Wide&Deep

## 学习目标

- 目标
  - 无
- 应用
  - 无

### 8.5.1 wide&deep

![](../images/wide&deep模型.png)

* Wide部分的输入特征：
  * 离散特征
  * 离散特征之间做组合
      * 不输入有连续值特征的，在W&D的paper里面是这样使用的。
* Deep部分的输入特征：
    * raw input+embeding处理 
    * 对**非连续值**之外的特征做embedding处理，这里都是策略特征，就是乘以个embedding-matrix。在TensorFlow里面的接口是：tf.feature_column.embedding_column，默认trainable=True. 
    * 对**连续值**特征的处理是：将其按照累积分布函数P(X≤x)，压缩至[0,1]内。 
> 注：训练：notice: Wide部分用FTRL来训练；Deep部分用AdaGrad来训练。

* Wide&Deep在TensorFlow里面的API接口为：tf.estimator.DNNLinearCombinedClassifier 
  * estimator = tf.estimator.DNNLinearCombinedClassifier()
    * model_dir="",                                                   
    * linear_feature_columns=wide_columns,                                                   
    * dnn_feature_columns=deep_columns
    * dnn_hidden_units=[]):dnn层的网络结构

#### tf.estimator传入参数原则

* LinearClassifier 和 LinearRegressor：接受所有类型的特征列。
* DNNClassifier 和 DNNRegressor：只接受密集列。其他类型的列必须封装在 indicator_column 或 embedding_column 中。
* DNNLinearCombinedClassifier 和 DNNLinearCombinedRegressor：
  * linear_feature_columns 参数接受任何类型的特征列。
  * dnn_feature_columns 参数只接受密集列。

代码：

```python
import tensorflow as tf

class WDL(object):
    """wide&deep模型
    """
    def __init__(self):
        pass

    @staticmethod
    def read_ctr_records():
        # 定义转换函数,输入时序列化的
        def parse_tfrecords_function(example_proto):
            features = {
                "label": tf.FixedLenFeature([], tf.int64),
                "feature": tf.FixedLenFeature([], tf.string)
            }
            parsed_features = tf.parse_single_example(example_proto, features)

            feature = tf.decode_raw(parsed_features['feature'], tf.float64)
            feature = tf.reshape(tf.cast(feature, tf.float32), [1, 121])
            # 特征顺序 1 channel_id,  100 article_vector, 10 user_weights, 10 article_weights
            # 1 channel_id类别型特征， 100维文章向量求平均值当连续特征，10维用户权重求平均值当连续特征
            channel_id = tf.cast(tf.slice(feature, [0, 0], [1, 1]), tf.int32)
            vector = tf.reduce_sum(tf.slice(feature, [0, 1], [1, 100]), axis=1)
            user_weights = tf.reduce_sum(tf.slice(feature, [0, 101], [1, 10]), axis=1)
            article_weights = tf.reduce_sum(tf.slice(feature, [0, 111], [1, 10]), axis=1)

            label = tf.cast(parsed_features['label'], tf.float32)

            # 构造字典 名称-tensor
            FEATURE_COLUMNS = ['channel_id', 'vector', 'user_weigths', 'article_weights']
            tensor_list = [channel_id, vector, user_weights, article_weights]

            feature_dict = dict(zip(FEATURE_COLUMNS, tensor_list))

            return feature_dict, label

        dataset = tf.data.TFRecordDataset(["./train_ctr_201905.tfrecords"])
        dataset = dataset.map(parse_tfrecords_function)
        dataset = dataset.batch(64)
        dataset = dataset.repeat()
        return dataset

    def build_estimator(self):
        """建立模型
        :param dataset:
        :return:
        """
        # 离散分类
        article_id = tf.feature_column.categorical_column_with_identity('channel_id', num_buckets=25)
        # 连续类型
        vector = tf.feature_column.numeric_column('vector')
        user_weigths = tf.feature_column.numeric_column('user_weigths')
        article_weights = tf.feature_column.numeric_column('article_weights')

        wide_columns = [article_id]

        # embedding_column用来表示类别型的变量
        deep_columns = [tf.feature_column.embedding_column(article_id, dimension=25),
                        vector, user_weigths, article_weights]

        estimator = tf.estimator.DNNLinearCombinedClassifier(model_dir="./ckpt/wide_and_deep",
                                                             linear_feature_columns=wide_columns,
                                                             dnn_feature_columns=deep_columns,
                                                             dnn_hidden_units=[1024, 512, 256])

        return estimator


if __name__ == '__main__':
    wdl = WDL()
    estimator = wdl.build_estimator()
    estimator.train(input_fn=wdl.read_ctr_records)
    eval_result = estimator.evaluate(input_fn=wdl.read_ctr_records)
    print(eval_result)
```

### 8.5.2 三个版本特征数据处理效果对比

| 特征不同的处理效果 | baseline           | 1离三特征、文章向量平均值、用户权重平均值、文章权重平均值 | 1离散特征、1个111连续特征 | 1离散特征、100个连续文章向量、10文章权重、10用户权重 |
| ------------------ | ------------------ | --------------------------------------------------------- | ------------------------- | ---------------------------------------------------- |
| accuracy           | 0.9051438053097345 | 0.9046435                                                 | 0.9046435                 | 0.9046435                                            |
| auc                | 0.719274521004087  | 0.57850575                                                | 0.5896939                 | 0.62383443                                           |

效果对比总结：

* 黑马头条数据离散数据数量过少，所以基础模型就已能够解决问题
* 如果随着离散或者连续特征的增多，使用WDL模型会带来一定的准确率或者AUC的提高

三个版本特征处理数据函数以及构建模型

* 第一个版本：

```python
@staticmethod
    def read_ctr_records_v1():
        # 定义转换函数,输入时序列化的
        def parse_tfrecords_function(example_proto):
            features = {
                "label": tf.FixedLenFeature([], tf.int64),
                "feature": tf.FixedLenFeature([], tf.string)
            }
            parsed_features = tf.parse_single_example(example_proto, features)

            feature = tf.decode_raw(parsed_features['feature'], tf.float64)
            feature = tf.reshape(tf.cast(feature, tf.float32), [1, 121])
            # 特征顺序 1 channel_id,  100 article_vector, 10 user_weights, 10 article_weights
            # 1 channel_id类别型特征， 100维文章向量求平均值当连续特征，10维用户权重求平均值当连续特征
            channel_id = tf.cast(tf.slice(feature, [0, 0], [1, 1]), tf.int32)
            vector = tf.reduce_mean(tf.slice(feature, [0, 1], [1, 100]), axis=1)
            user_weights = tf.reduce_mean(tf.slice(feature, [0, 101], [1, 10]), axis=1)
            article_weights = tf.reduce_mean(tf.slice(feature, [0, 111], [1, 10]), axis=1)

            label = tf.cast(parsed_features['label'], tf.float32)

            # 构造字典 名称-tensor
            FEATURE_COLUMNS = ['channel_id', 'vector', 'user_weights', 'article_weights']
            tensor_list = [channel_id, vector, user_weights, article_weights]

            feature_dict = dict(zip(FEATURE_COLUMNS, tensor_list))

            return feature_dict, label

        dataset = tf.data.TFRecordDataset(["./ctr_train_20190706.tfrecords"])
        dataset = dataset.map(parse_tfrecords_function)
        dataset = dataset.batch(64)
        dataset = dataset.repeat(100)
        return dataset

    

    def build_estimator(self):
        """
        构建特征列输入到模型中
        :return:
        """
        # 指定列特征
        channel_id = tf.feature_column.categorical_column_with_identity('channel_id', num_buckets=25)

        vector = tf.feature_column.numeric_column('vector')
        user_weights = tf.feature_column.numeric_column('user_weights')
        article_weights = tf.feature_column.numeric_column('article_weights')

        # wide侧
        wide_columns = [channel_id]

        # deep侧
        deep_columns = [
            tf.feature_column.embedding_column(channel_id, dimension=25),
            vector,
            user_weights,
            article_weights
        ]

        # 构造模型
        estimator = tf.estimator.DNNLinearCombinedClassifier(model_dir="./tmp/ckpt/wide_and_deep",
                                                             linear_feature_columns=wide_columns,
                                                             dnn_feature_columns=deep_columns,
                                                             dnn_hidden_units=[256, 128, 64])
        return estimator
```

* 第二个版本：

```python
@staticmethod
    def read_ctr_records_v2():
        # 定义转换函数,输入时序列化的
        def parse_tfrecords_function(example_proto):
            features = {
                "label": tf.FixedLenFeature([], tf.int64),
                "feature": tf.FixedLenFeature([], tf.string)
            }
            parsed_features = tf.parse_single_example(example_proto, features)

            feature = tf.decode_raw(parsed_features['feature'], tf.float64)
            feature = tf.reshape(tf.cast(feature, tf.float32), [1, 121])
            channel_id = tf.cast(tf.slice(feature, [0, 0], [1, 1]), tf.int32)

            label = tf.cast(parsed_features['label'], tf.float32)

            # 构造字典 名称-tensor
            FEATURE_COLUMNS = ['channel_id', 'feature']

            tensor_list = [channel_id, feature]

            feature_dict = dict(zip(FEATURE_COLUMNS, tensor_list))

            return feature_dict, label

        dataset = tf.data.TFRecordDataset(["./ctr_train_20190706.tfrecords"])
        dataset = dataset.map(parse_tfrecords_function)
        dataset = dataset.batch(64)
        dataset = dataset.repeat(100)
        return dataset

def build_estimator_v2(self):
        """
        构建特征列输入到模型中
        :return:
        """
        # 指定列特征
        channel_id = tf.feature_column.categorical_column_with_identity('channel_id', num_buckets=25)

        feature = tf.feature_column.numeric_column('feature', shape=[1, 121])

        # wide侧
        wide_columns = [channel_id]

        # deep侧
        deep_columns = [
            tf.feature_column.embedding_column(channel_id, dimension=25),
            feature
        ]

        # 构造模型
        estimator = tf.estimator.DNNLinearCombinedClassifier(model_dir="./tmp/ckpt/wide_and_deep_v2",
                                                             linear_feature_columns=wide_columns,
                                                             dnn_feature_columns=deep_columns,
                                                             dnn_hidden_units=[256, 128, 64])
        return estimator
```

* 第三个版本

```python
@staticmethod
    def read_ctr_records_v3():
        # 定义转换函数,输入时序列化的
        def parse_tfrecords_function(example_proto):
            features = {
                "label": tf.FixedLenFeature([], tf.int64),
                "feature": tf.FixedLenFeature([], tf.string)
            }
            parsed_features = tf.parse_single_example(example_proto, features)

            feature = tf.decode_raw(parsed_features['feature'], tf.float64)
            feature = tf.reshape(tf.cast(feature, tf.float32), [1, 121])
            channel_id = tf.cast(tf.slice(feature, [0, 0], [1, 1]), tf.int32)
            vector = tf.slice(feature, [0, 1], [1, 100])
            user_weights = tf.slice(feature, [0, 101], [1, 10])
            article_weights = tf.slice(feature, [0, 111], [1, 10])

            label = tf.cast(parsed_features['label'], tf.float32)

            # 构造字典 名称-tensor
            FEATURE_COLUMNS = ['channel_id', 'vector', 'user_weights', 'article_weights']

            tensor_list = [channel_id, vector, user_weights, article_weights]

            feature_dict = dict(zip(FEATURE_COLUMNS, tensor_list))

            return feature_dict, label

        dataset = tf.data.TFRecordDataset(["./ctr_train_20190706.tfrecords"])
        dataset = dataset.map(parse_tfrecords_function)
        dataset = dataset.batch(64)
        dataset = dataset.repeat(100)
        return dataset
        
        
def build_estimator_v3(self):
        """
        构建特征列输入到模型中
        :return:
        """
        # 指定列特征
        channel_id = tf.feature_column.categorical_column_with_identity('channel_id', num_buckets=25)

        vector = tf.feature_column.numeric_column('vector', shape=[1, 100])
        user_weights = tf.feature_column.numeric_column('user_weights', shape=[1, 10])
        article_weights = tf.feature_column.numeric_column('article_weights', shape=[1, 10])

        # wide侧
        wide_columns = [channel_id]

        # deep侧
        deep_columns = [
            tf.feature_column.embedding_column(channel_id, dimension=25),
            vector,
            user_weights,
            article_weights
        ]

        # 构造模型
        estimator = tf.estimator.DNNLinearCombinedClassifier(model_dir="./tmp/ckpt/wide_and_deep_v3",
                                                             linear_feature_columns=wide_columns,
                                                             dnn_feature_columns=deep_columns,
                                                             dnn_hidden_units=[256, 128, 64])
        return estimator
```

