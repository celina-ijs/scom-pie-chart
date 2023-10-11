function visualizationOptions(columns: string[]) {
    return {
        type: 'object',
        title: 'Visualization Options',
        properties: {
            xColumn: {
                type: 'string',
                title: 'X column',
                enum: columns,
                required: true
            },
            yColumn: {
                type: 'string',
                title: 'Y column',
                enum: columns,
                required: true
            },
            serieName: {
                type: 'string'
            },
            numberFormat: {
                type: 'string'
            },
            legend: {
                type: 'object',
                title: 'Show Chart Legend',
                properties: {
                    show: {
                        type: 'boolean'
                    },
                    fontColor: {
                        type: 'string',
                        format: 'color'
                    },
                    scroll: {
                        type: 'boolean'
                    },
                    position: {
                        type: 'string',
                        enum: ['top', 'bottom', 'left', 'right']
                    }
                }
            },
            showDataLabels: {
                type: 'boolean'
            },
            padding: {
                type: 'object',
                title: 'Padding (px)',
                properties: {
                    top: {
                        type: 'number'
                    },
                    bottom: {
                        type: 'number'
                    },
                    left: {
                        type: 'number'
                    },
                    right: {
                        type: 'number'
                    }
                }
            },
            valuesOptions: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            required: true
                        },
                        color: {
                            type: 'string',
                            format: 'color',
                            required: true
                        }
                    }
                }
            }
        }
    }
}

const theme = {
    darkShadow: {
        type: 'boolean'
    },
    customFontColor: {
        type: 'boolean'
    },
    fontColor: {
        type: 'string',
        format: 'color'
    },
    customBackgroundColor: {
        type: 'boolean'
    },
    backgroundColor: {
        type: 'string',
        format: 'color'
    },
    height: {
        type: 'string'
    }
}


const themeUISchema = {
    type: 'Category',
    label: 'Theme',
    elements: [
        {
            type: 'VerticalLayout',
            elements: [
                {
                    type: 'HorizontalLayout',
                    elements: [
                        {
                            type: 'Control',
                            scope: '#/properties/customFontColor'
                        },
                        {
                            type: 'Control',
                            scope: '#/properties/fontColor',
                            rule: {
                                effect: 'ENABLE',
                                condition: {
                                    scope: '#/properties/customFontColor',
                                    schema: {
                                        const: true
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    type: 'HorizontalLayout',
                    elements: [
                        {
                            type: 'Control',
                            scope: '#/properties/customBackgroundColor'
                        },
                        {
                            type: 'Control',
                            scope: '#/properties/backgroundColor',
                            rule: {
                                effect: 'ENABLE',
                                condition: {
                                    scope: '#/properties/customBackgroundColor',
                                    schema: {
                                        const: true
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    type: 'HorizontalLayout',
                    elements: [
                        {
                            type: 'Control',
                            scope: '#/properties/darkShadow'
                        },
                        {
                            type: 'Control',
                            scope: '#/properties/height'
                        }
                    ]
                }
            ]
        }
    ]
}

export function getBuilderSchema(columns: string[]) {
    return {
        dataSchema: {
            type: 'object',
            required: ['title'],
            properties: {
                title: {
                    type: 'string'
                },
                description: {
                    type: 'string'
                },
                ...theme
            }
        },
        uiSchema: {
            type: 'Categorization',
            elements: [
                {
                    type: 'Category',
                    label: 'General',
                    elements: [
                        {
                            type: 'VerticalLayout',
                            elements: [
                                {
                                    type: 'Control',
                                    scope: '#/properties/title'
                                },
                                {
                                    type: 'Control',
                                    scope: '#/properties/description'
                                }
                            ]
                        }
                    ]
                },
                themeUISchema
            ]
        },
        advanced: {
            dataSchema: {
                type: 'object',
                properties: {
                    options: visualizationOptions(columns)
                }
            },
            uiSchema: {
                type: 'VerticalLayout',
                elements: [
                    {
                        type: 'HorizontalLayout',
                        elements: [
                            {
                                type: 'Control',
                                scope: '#/properties/options',
                                options: {
                                    detail: {
                                        type: 'VerticalLayout'
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        }
    }
}

export function getEmbedderSchema(columns: string[]) {
    return {
        dataSchema: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    required: true
                },
                description: {
                    type: 'string'
                },
                options: visualizationOptions(columns),
                ...theme
            }
        },
        uiSchema: {
            type: 'Categorization',
            elements: [
                {
                    type: 'Category',
                    label: 'General',
                    elements: [
                        {
                            type: 'VerticalLayout',
                            elements: [
                                {
                                    type: 'Control',
                                    scope: '#/properties/title'
                                },
                                {
                                    type: 'Control',
                                    scope: '#/properties/description'
                                },
                                {
                                    type: 'HorizontalLayout',
                                    elements: [
                                        {
                                            type: 'Control',
                                            scope: '#/properties/options',
                                            options: {
                                                detail: {
                                                    type: 'VerticalLayout'
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                themeUISchema
            ]
        }
    }
}