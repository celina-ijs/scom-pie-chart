import {
  Module,
  customModule,
  ControlElement,
  customElements,
  Container,
  IDataSchema,
  HStack,
  Label,
  VStack,
  Styles,
  Panel,
  PieChart,
  Button,
  IUISchema
} from '@ijstech/components';
import { IPieChartConfig, IPieChartOptions, formatNumberByFormat } from './global/index';
import { chartStyle, containerStyle, textStyle } from './index.css';
import assets from './assets';
import dataJson from './data.json';
import ScomChartDataSourceSetup, { DataSource, fetchContentByCID, callAPI, ModeType } from '@scom/scom-chart-data-source-setup';
import { getBuilderSchema, getEmbedderSchema } from './formSchema';
import ScomPieChartDataOptionsForm from './dataOptionsForm';
const Theme = Styles.Theme.ThemeVars;

interface ScomPieChartElement extends ControlElement {
  lazyLoad?: boolean;
  data: IPieChartConfig
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['i-scom-pie-chart']: ScomPieChartElement;
    }
  }
}

const DefaultData: IPieChartConfig = {
  dataSource: DataSource.Dune,
  queryId: '',
  apiEndpoint: '',
  title: '',
  options: undefined,
  mode: ModeType.LIVE
};

@customModule
@customElements('i-scom-pie-chart')
export default class ScomPieChart extends Module {
  private pieChartContainer: VStack;
  private vStackInfo: HStack;
  private pnlPieChart: Panel;
  private loadingElm: Panel;
  private lbTitle: Label;
  private lbDescription: Label;
  private columnNames: string[] = [];
  private pieChartData: { [key: string]: string | number }[] = [];

  private _data: IPieChartConfig = DefaultData;
  tag: any = {};
  defaultEdit: boolean = true;

  static async create(options?: ScomPieChartElement, parent?: Container) {
    let self = new this(parent, options);
    await self.ready();
    return self;
  }

  constructor(parent?: Container, options?: ScomPieChartElement) {
    super(parent, options);
  }

  private getData() {
    return this._data;
  }

  private async setData(data: IPieChartConfig) {
    this._data = data;
    this.updateChartData();
  }

  private getTag() {
    return this.tag;
  }

  private async setTag(value: any, fromParent?: boolean) {
    if (fromParent) {
      this.tag.parentFontColor = value.fontColor;
      this.tag.parentCustomFontColor = value.customFontColor;
      this.tag.parentBackgroundColor = value.backgroundColor;
      this.tag.parentCustomBackgroundColor = value.customBackgoundColor;
      this.tag.customWidgetsBackground = value.customWidgetsBackground;
      this.tag.widgetsBackground = value.widgetsBackground;
      this.tag.customWidgetsColor = value.customWidgetsColor;
      this.tag.widgetsColor = value.widgetsColor;
      this.onUpdateBlock();
      return;
    }
    const newValue = value || {};
    for (let prop in newValue) {
      if (newValue.hasOwnProperty(prop)) {
        this.tag[prop] = newValue[prop];
      }
    }
    this.width = this.tag.width || 700;
    this.height = this.tag.height || 500;
    this.onUpdateBlock();
  }

  private _getActions(dataSchema: IDataSchema, uiSchema: IUISchema, advancedSchema?: IDataSchema) {
    const builderSchema = getBuilderSchema(this.columnNames);
    const actions = [
      {
        name: 'Edit',
        icon: 'edit',
        command: (builder: any, userInputData: any) => {
          let oldData: IPieChartConfig = DefaultData;
          let oldTag = {};
          return {
            execute: async () => {
              oldData = JSON.parse(JSON.stringify(this._data));
              const {
                title,
                description,
                options,
                ...themeSettings
              } = userInputData;

              const generalSettings = {
                title,
                description,
              };

              if (advancedSchema) {
                this._data = { ...this._data, ...generalSettings };
              } else {
                this._data = { ...generalSettings as IPieChartConfig, options };
              }
              if (builder?.setData) builder.setData(this._data);
              this.setData(this._data);

              oldTag = JSON.parse(JSON.stringify(this.tag));
              if (builder?.setTag) builder.setTag(themeSettings);
              else this.setTag(themeSettings);
            },
            undo: () => {
              if (advancedSchema) oldData = { ...oldData, options: this._data.options };
              if (builder?.setData) builder.setData(oldData);
              this.setData(oldData);

              this.tag = JSON.parse(JSON.stringify(oldTag));
              if (builder?.setTag) builder.setTag(this.tag);
              else this.setTag(this.tag);
            },
            redo: () => { }
          }
        },
        userInputDataSchema: dataSchema,
        userInputUISchema: uiSchema
      },
      {
        name: 'Data',
        icon: 'database',
        command: (builder: any, userInputData: any) => {
          let _oldData: IPieChartConfig = DefaultData;
          return {
            execute: async () => {
              _oldData = { ...this._data };
              if (userInputData?.mode) this._data.mode = userInputData?.mode;
              if (userInputData?.file) this._data.file = userInputData?.file;
              if (userInputData?.dataSource) this._data.dataSource = userInputData?.dataSource;
              if (userInputData?.queryId) this._data.queryId = userInputData?.queryId;
              if (userInputData?.apiEndpoint) this._data.apiEndpoint = userInputData?.apiEndpoint;
              if (userInputData?.options !== undefined) this._data.options = userInputData.options;
              if (builder?.setData) builder.setData(this._data);
              this.setData(this._data);
            },
            undo: () => {
              if (builder?.setData) builder.setData(_oldData);
              this.setData(_oldData);
            },
            redo: () => { }
          }
        },
        customUI: {
          render: (data?: any, onConfirm?: (result: boolean, data: any) => void, onChange?: (result: boolean, data: any) => void) => {
            const vstack = new VStack(null, { gap: '1rem' });
            const dataSourceSetup = new ScomChartDataSourceSetup(null, {
              ...this._data,
              chartData: JSON.stringify(this.pieChartData),
              onCustomDataChanged: async (dataSourceSetupData: any) => {
                if (onChange) {
                  onChange(true, {
                    ...this._data,
                    ...dataSourceSetupData
                  });
                }
              }
            });
            const hstackBtnConfirm = new HStack(null, {
              verticalAlignment: 'center',
              horizontalAlignment: 'end'
            });
            const button = new Button(null, {
              caption: 'Confirm',
              width: 'auto',
              height: 40,
              font: { color: Theme.colors.primary.contrastText }
            });
            hstackBtnConfirm.append(button);
            vstack.append(dataSourceSetup);
            const dataOptionsForm = new ScomPieChartDataOptionsForm(null, {
              options: this._data.options,
              dataSchema: JSON.stringify(advancedSchema),
              uiSchema: JSON.stringify(builderSchema.advanced.uiSchema)
            });
            vstack.append(dataOptionsForm);
            vstack.append(hstackBtnConfirm);
            if (onChange) {
              dataOptionsForm.onCustomInputChanged = async (optionsFormData: any) => {
                onChange(true, {
                  ...this._data,
                  ...optionsFormData,
                  ...dataSourceSetup.data
                });
              }
            }
            button.onClick = async () => {
              const { dataSource, file, mode } = dataSourceSetup.data;
              if (mode === ModeType.LIVE && !dataSource) return;
              if (mode === ModeType.SNAPSHOT && !file?.cid) return;
              if (onConfirm) {
                const optionsFormData = await dataOptionsForm.refreshFormData();
                onConfirm(true, {
                  ...this._data,
                  ...optionsFormData,
                  ...dataSourceSetup.data
                });
              }
            }
            return vstack;
          }
        }
      }
    ]
    // if (advancedSchema) {
    //   const advanced = {
    //     name: 'Advanced',
    //     icon: 'sliders-h',
    //     command: (builder: any, userInputData: any) => {
    //       let _oldData: IPieChartOptions = { };
    //       return {
    //         execute: async () => {
    //           _oldData = { ...this._data?.options };
    //           if (userInputData?.options !== undefined) this._data.options = userInputData.options;
    //           if (builder?.setData) builder.setData(this._data);
    //           this.setData(this._data);
    //         },
    //         undo: () => {
    //           this._data.options = { ..._oldData };
    //           if (builder?.setData) builder.setData(this._data);
    //           this.setData(this._data);
    //         },
    //         redo: () => { }
    //       }
    //     },
    //     userInputDataSchema: advancedSchema,
    //     userInputUISchema: builderSchema.advanced.uiSchema as any
    //   }
    //   actions.push(advanced);
    // }
    return actions
  }

  getConfigurators() {
    const self = this;
    return [
      {
        name: 'Builder Configurator',
        target: 'Builders',
        getActions: () => {
          const builderSchema = getBuilderSchema(this.columnNames);
          const dataSchema = builderSchema.dataSchema as IDataSchema;
          const uiSchema = builderSchema.uiSchema as IUISchema;
          const advancedSchema = builderSchema.advanced.dataSchema as any;
          return this._getActions(dataSchema, uiSchema, advancedSchema);
        },
        getData: this.getData.bind(this),
        setData: async (data: IPieChartConfig) => {
          const defaultData = dataJson.defaultBuilderData;
          await this.setData({ ...defaultData, ...data });
        },
        getTag: this.getTag.bind(this),
        setTag: this.setTag.bind(this)
      },
      {
        name: 'Embedder Configurator',
        target: 'Embedders',
        getActions: () => {
          const embedderSchema = getEmbedderSchema(this.columnNames);
          const dataSchema = embedderSchema.dataSchema as any;
          const uiSchema = embedderSchema.uiSchema as IUISchema;
          return this._getActions(dataSchema, uiSchema);
        },
        getLinkParams: () => {
          const data = this._data || {};
          return {
            data: window.btoa(JSON.stringify(data))
          }
        },
        setLinkParams: async (params: any) => {
          if (params.data) {
            const utf8String = decodeURIComponent(params.data);
            const decodedString = window.atob(utf8String);
            const newData = JSON.parse(decodedString);
            let resultingData = {
              ...self._data,
              ...newData
            };
            await this.setData(resultingData);
          }
        },
        getData: this.getData.bind(this),
        setData: this.setData.bind(this),
        getTag: this.getTag.bind(this),
        setTag: this.setTag.bind(this)
      }
    ]
  }

  private updateStyle(name: string, value: any) {
    value ? this.style.setProperty(name, value) : this.style.removeProperty(name);
  }

  private updateTheme() {
    if (this.pieChartContainer) {
      this.pieChartContainer.style.boxShadow = this.tag?.darkShadow ? '0 -2px 10px rgba(0, 0, 0, 1)' : 'rgba(0, 0, 0, 0.16) 0px 1px 4px';
    }
    const tags = this.tag || {};
    this.updateStyle('--custom-text-color', tags.customFontColor ? tags.fontColor : tags.customWidgetsColor ? tags.widgetsColor : tags.parentCustomFontColor ? tags.parentFontColor : '');
    this.updateStyle('--custom-background-color', tags.customBackgroundColor ? tags.backgroundColor : tags.customWidgetsBackground ? tags.widgetsBackground : tags.parentCustomBackgroundColor ? tags.parentBackgroundColor : '');
  }

  private onUpdateBlock() {
    this.renderChart();
    this.updateTheme();
  }

  private async updateChartData() {
    this.loadingElm.visible = true;
    if (this._data?.mode === ModeType.SNAPSHOT)
      await this.renderSnapshotData();
    else
      await this.renderLiveData();
    this.loadingElm.visible = false;
  }

  private async renderSnapshotData() {
    if (this._data.file?.cid) {
      try {
        const data = await fetchContentByCID(this._data.file.cid);
        if (data) {
          const { metadata, rows } = data;
          this.pieChartData = rows;
          this.columnNames = metadata?.column_names || [];
          this.onUpdateBlock();
          return;
        }
      } catch { }
    }
    this.pieChartData = [];
    this.columnNames = [];
    this.onUpdateBlock();
  }

  private async renderLiveData() {
    const dataSource = this._data.dataSource as DataSource;
    if (dataSource) {
      try {
        const data = await callAPI({
          dataSource,
          queryId: this._data.queryId,
          apiEndpoint: this._data.apiEndpoint
        });
        if (data) {
          const { metadata, rows } = data;
          this.pieChartData = rows;
          this.columnNames = metadata?.column_names || [];
          this.onUpdateBlock();
          return;
        }
      } catch { }
    }
    this.pieChartData = [];
    this.columnNames = [];
    this.onUpdateBlock();
  }

  private renderChart() {
    if ((!this.pnlPieChart && this._data.options) || !this._data.options) return;
    const { title, description, options } = this._data;
    this.lbTitle.caption = title;
    this.lbDescription.caption = description;
    this.lbDescription.visible = !!description;
    this.pnlPieChart.height = `calc(100% - ${this.vStackInfo.offsetHeight + 10}px)`;
    const { xColumn, yColumn, legend, showDataLabels, serieName, numberFormat, valuesOptions, padding = {} } = options;
    let _legend = {
      show: legend?.show,
    }
    if (legend) {
      if (legend.position) {
        _legend[legend.position] = 'auto';
        if (['left', 'right'].includes(legend.position)) {
          _legend['orient'] = 'vertical';
        }
      }
      if (legend.scroll) {
        _legend['type'] = 'scroll';
      }
      if (legend.fontColor) {
        _legend['textStyle'] = { color: legend.fontColor };
      }
    }
    const data = this.pieChartData.map((v) => {
      const values = valuesOptions.find(f => f.name === v[xColumn]);
      return {
        value: v[yColumn],
        name: values?.name || v[xColumn],
        itemStyle: values ? { color: values.color } : undefined,
        label: showDataLabels ? {
          show: true,
          position: 'inside',
          formatter: function (params: any) {
            return params.percent >= 5 ? params.percent + '%' : '';
          }
        } : undefined
      }
    });

    const gridPadding = {
      top: padding.top || 60,
      bottom: padding.bottom || 60,
      left: padding.left || '10%',
      right: padding.right || '10%'
    }
    const _chartData: any = {
      tooltip: {
        trigger: 'item',
        position: function (point: any, params: any, dom: any, rect: any, size: any) {
          var x = point[0];
          var y = point[1];
          var viewWidth = document.documentElement.clientWidth;
          var viewHeight = document.documentElement.clientHeight;
          var boxWidth = size.contentSize[0];
          var boxHeight = size.contentSize[1];
          // calculate x position of tooltip
          if (x + boxWidth > viewWidth) {
            x = x - boxWidth;
          }
          // calculate y position of tooltip
          if (y + boxHeight > viewHeight) {
            y = y - boxHeight;
          }
          if (x < 0) x = 0;
          if (y < 0) y = 0;
          return [x, y];
        },
        formatter: (params: any) => {
          return `<b>${params.name}</b> <br />
            ${params.marker} ${params.seriesName}: ${formatNumberByFormat(params.value, numberFormat)}`;
        }
      },
      legend: _legend,
      grid: {
        ...gridPadding
      },
      series: [
        {
          name: serieName || yColumn,
          data: data,
          type: 'pie',
          radius: ['40%', '70%'],
          label: {
            show: false,
            formatter: '{d}%'
          }
        }
      ]
    };
    this.pnlPieChart.clearInnerHTML();
    const pieChart = new PieChart(this.pnlPieChart, {
      data: _chartData,
      width: '100%',
      height: '100%'
    });
    pieChart.data = _chartData;
    pieChart.drawChart();
  }

  private resizeChart() {
    if (this.pnlPieChart) {
      (this.pnlPieChart.firstChild as PieChart)?.resize();
    }
  }

  async init() {
    this.isReadyCallbackQueued = true;
    this.updateTheme();
    super.init();
    this.classList.add(chartStyle);
    this.setTag({
      darkShadow: false,
      height: 500
    })
    this.maxWidth = '100%';
    this.pieChartContainer.style.boxShadow = 'rgba(0, 0, 0, 0.16) 0px 1px 4px';
    const lazyLoad = this.getAttribute('lazyLoad', true, false);
    if (!lazyLoad) {
      const data = this.getAttribute('data', true);
      if (data) {
        this.setData(data);
      }
    }
    this.isReadyCallbackQueued = false;
    this.executeReadyCallback();
    window.addEventListener('resize', () => {
      setTimeout(() => {
        this.resizeChart();
      }, 300);
    });
  }

  render() {
    return (
      <i-vstack
        id="pieChartContainer"
        position="relative"
        height="100%"
        padding={{ top: 10, bottom: 10, left: 10, right: 10 }}
        class={containerStyle}
      >
        <i-vstack id="loadingElm" class="i-loading-overlay">
          <i-vstack class="i-loading-spinner" horizontalAlignment="center" verticalAlignment="center">
            <i-icon
              class="i-loading-spinner_icon"
              image={{ url: assets.fullPath('img/loading.svg'), width: 36, height: 36 }}
            />
          </i-vstack>
        </i-vstack>
        <i-vstack
          id="vStackInfo"
          width="100%"
          maxWidth="100%"
          margin={{ left: 'auto', right: 'auto', bottom: 10 }}
          verticalAlignment="center"
        >
          <i-label id="lbTitle" font={{ bold: true }} class={textStyle} />
          <i-label id="lbDescription" margin={{ top: 5 }} class={textStyle} />
        </i-vstack>
        <i-panel id="pnlPieChart" width="100%" height="inherit" />
      </i-vstack>
    )
  }
}