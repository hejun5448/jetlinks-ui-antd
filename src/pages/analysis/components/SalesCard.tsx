import React, { useEffect, useState } from 'react';
import { Card, Col, DatePicker, Icon, Radio, Row, Tabs } from 'antd';
import { FormattedMessage } from 'umi-plugin-react/locale';
import Charts from './Charts';
import styles from '../style.less';
import apis from '@/services';
import moment from 'moment';
import { RangePickerValue } from 'antd/es/date-picker/interface';

const { Withnegative } = Charts;
const { TabPane } = Tabs;

export interface State {
  gatewayDataList: any[];
  ticksDataList: any[];
  currentTime: string;
  time: string;
  selectionTime: string
}

const SalesCard = ({
   loading,
   isActive,
   handleRangePickerChange,
 }: {
   loading: boolean;
   isActive: (key: '1h' | '1d' | '7d' | '30d') => string;
   handleRangePickerChange: (dates: RangePickerValue, dateStrings: [string, string]) => void;
 },
) => {
  let gatewayMonitor: (from: string, to: string, time: string) => void;
  const initState: State = {
    gatewayDataList: [],
    ticksDataList: [],
    currentTime: '',
    time: '',
    selectionTime: '',
  };

  const [gatewayData, setGatewayData] = useState(initState.gatewayDataList);
  const [ticksDataList, setTicksDataList] = useState(initState.ticksDataList);
  const [time, setTime] = useState(initState.time);
  const [selectionTime, setSelectionTime] = useState(initState.selectionTime);

  const calculationDate = (val: number) => {
    const dd = new Date();
    dd.setDate(dd.getDate() - val);
    return `${dd.getFullYear()}-${(dd.getMonth() + 1) < 10 ? `0${dd.getMonth() + 1}` : (dd.getMonth() + 1)}-${dd.getDate() < 10 ? `0${dd.getDate()}` : dd.getDate()} ${dd.getHours() < 10 ? `0${dd.getHours()}` : dd.getHours()}:${dd.getMinutes() < 10 ? `0${dd.getMinutes()}` : dd.getMinutes()}:${dd.getSeconds() < 10 ? `0${dd.getSeconds()}` : dd.getSeconds()}`;
  };

  const timeMap = {
    '1h': '1m',
    '1d': '24m',
    '7d': '168m',
    '30d': '12h',
  };

  useEffect(() => {
    let da = new Date();
    da.setHours(da.getHours() - 1);
    gatewayMonitor(da, calculationDate(0), '1m');
    setSelectionTime(calculationDate(0));
    setTime('1m');
  }, []);

  gatewayMonitor = (from: string, to: string, time: string) => {

    let formatData = '';

    if (time === '1m') {
      formatData = 'HH时mm分';
    } else if (time === '12h') {
      formatData = 'MM月dd日HH时';
    } else {
      formatData = 'MM月dd日HH时mm分';
    }
    const list = [
      {
        'dashboard': 'gatewayMonitor',
        'object': 'deviceGateway',
        'measurement': 'received_message',
        'dimension': 'agg',
        'group': 'sameDay',
        'params': {
          'time': time || '12h',
          'limit': 60,
          'format': formatData,
          'from': from,
          'to': to,
        },
      },
    ];

    apis.analysis.getMulti(list)
      .then((response: any) => {
        const tempResult = response?.result;
        if (tempResult) {
          const dataList = [];
          const ticksList = [];
          tempResult.forEach(item => {
            dataList.push({
              year: item.data.timeString,
              消息量: item.data.value,
            });
            if (item.data.timestamp % 4 === 0 && item.data.timestamp !== 0) {
              ticksList.push(item.data.timeString);
            }
          });
          setTicksDataList(ticksList);
          setGatewayData(dataList);
        }
      });
  };

  function deviceTime(e) {
    const value = e.target.value;
    setTime(timeMap[value]);
    const dd = new Date(selectionTime);

    if (value === '1h') {
      dd.setHours(dd.getHours() - 1);
    } else if (value === '1d') {
      dd.setDate(dd.getDate() - 1);
    } else if (value === '7d') {
      dd.setDate(dd.getDate() - 7);
    } else if (value === '30d') {
      dd.setDate(dd.getDate() - 30);
    }

    gatewayMonitor(formatData(dd), formatData(new Date()), timeMap[value]);
    //setCurrentTime(dd);
  }

  const formatData = (value: string) => {
    const dd = new Date(value);
    return `${dd.getFullYear()}-${(dd.getMonth() + 1) < 10 ? `0${dd.getMonth() + 1}` : (dd.getMonth() + 1)}-${dd.getDate() < 10 ? `0${dd.getDate()}` : dd.getDate()} ${dd.getHours() < 10 ? `0${dd.getHours()}` : dd.getHours()}:${dd.getMinutes() < 10 ? `0${dd.getMinutes()}` : dd.getMinutes()}:${dd.getSeconds() < 10 ? `0${dd.getSeconds()}` : dd.getSeconds()}`;
  };

  function onOk(value) {
    setSelectionTime(value);
    const dd = new Date(value);
    if (time === '1m') {
      dd.setHours(dd.getHours() - 1);
    } else if (time === '24m') {
      dd.setDate(dd.getDate() - 1);
    } else if (time === '168m') {
      dd.setDate(dd.getDate() - 7);
    } else if (time === '12h') {
      dd.setDate(dd.getDate() - 30);
    }
    gatewayMonitor(formatData(dd), formatData(value), time);
  }

  return (
    <Card loading={loading} bordered={false} bodyStyle={{ padding: 0 }}>
      <div className={styles.salesCard}>
        <Tabs
          tabBarExtraContent={
            <div className={styles.salesExtraWrap}>
              <div className={styles.salesExtra}>
                <Radio.Group defaultValue="1h" onChange={deviceTime}>
                  <Radio.Button value="1h">
                    1小时
                  </Radio.Button>
                  <Radio.Button value="1d">
                    1天
                  </Radio.Button>
                  <Radio.Button value="7d">
                    7天
                  </Radio.Button>
                  <Radio.Button value="30d">
                    30天
                  </Radio.Button>
                </Radio.Group>
              </div>
              <DatePicker showTime defaultValue={moment(new Date(), 'yyyy-MM-dd HH:mm:ss')}
                          placeholder="结束时间" onOk={onOk} format="YYYY-MM-DD HH:mm:ss"/>
            </div>
          }
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
        >
          <TabPane
            tab={'设备消息'}
            key="sales"
          >
            <Row>
              <Col>
                <div className={styles.salesBar}>
                  <Withnegative
                    height={400}
                    datas={gatewayData}
                    ticks={ticksDataList}
                  />
                </div>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </div>
    </Card>
  );
};

export default SalesCard;
