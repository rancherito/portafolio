import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { kkk } from './env';

@Component({
    selector: 'app-math-tutor',
    standalone: true,
    imports: [CommonModule, FormsModule, FormsModule],
    template: `
        <div style="display: flex; flex-direction: column;">
            <textarea [(ngModel)]="prompt"></textarea>
            @if (prompt != null && prompt.trim() != '') {
                <button (click)="run()">Solve Problem</button>
            }

            <div>
                <label>JSON</label><br />
                <textarea [ngModel]="jsonField" rows="10" cols="50" readonly></textarea>
            </div>
            <div>
                <label>TEMPLATE</label><br />
                <textarea [ngModel]="templateField" rows="10" cols="50" readonly></textarea>
            </div>
            <div>
                <label>SCRIPT</label><br />
                <textarea [ngModel]="scriptField" rows="10" cols="50" readonly></textarea>
            </div>
            <div>
                <label>STYLES</label><br />
                <textarea [ngModel]="stylesField" rows="10" cols="50" readonly></textarea>
            </div>
        </div>
    `,
})
export class MathTutorComponent implements OnInit {
    result: string = '';
    openai = new OpenAI({
        apiKey: kkk,
        dangerouslyAllowBrowser: true,
    });

    @Input() prompt: string = '';

    jsonField: string = '';
    templateField: string = '';
    scriptField: string = '';
    stylesField: string = '';

    @Output() data = new EventEmitter<{ json: string; template: string; javascript: string; styles: string }>();

    async run() {
        if (this.prompt == null || this.prompt.trim() == '') return;

        const types = z.enum(['text', 'paragraph', 'group', 'image', 'color', 'color-set', 'bool', 'number', 'align', 'icon', 'link', 'box-properties', 'units', 'background', 'array']);

        const ComplexFieldConfigSchema2 = z.object({
            type: types,
            field: z.string(),
            label: z.string(),
            required: z.boolean(),
            form: z.array(z.string()).optional(),
            default: z.string().optional(),
        });

        const InstructionFormat = z.object({
            template: z.string(),
            json: z.string(),
            styles: z.string(),
            javascript: z.string(),
        });

        const completion = await this.openai.beta.chat.completions.parse({
            model: 'gpt-4o-mini-2024-07-18',
            messages: [
                {
                    role: 'system',
                    content: `
ERES UN DSIÑADOR DE COMPONENTES, MODERNOS Y MINIMALISTAS, los componentes estan formados por 4 campos, template, styles, javascript y JSON
Los templates tiene esta forma: 
EJEPLO 01:
div>
	{{algunaVariable}}
/div>
o esta forma
EJEMPLO 02:
<div data-value="{{info}}">
	<for item="category" list="categories">
	<div class="category">
		<h2>{{category.name}}</h2>
		<if compare="category.items.length > 0">
		<ul>
			<for item="item" index="i" list="category.items">
			<li>{{item.name}} - <if compare="item.inStock">Disponible</if><if compare="!item.inStock">Agotado</if></li>
			</for>
		</ul>
		</if>
		<else>
		<p>No hay items en esta categoría.</p>
		</else>
	</div>
	</for>
</div>

NOTA: Los templates son plantillas que interactuan con los datos del JSON, los datos se acceden con {{}} y las condiciones se hacen con <if>, <else-if>, <else> y las iteraciones se hacen con <for>,
por lo general los templates son html, pueden tener atributos data- para acceder a los datos en tiempo de ejecucion mediante javascript, usarlo solo si es necesario

Los estilos tienen esta forma:
	.category {
		background-color: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 4px;
		margin: 10px;
		padding: 10px;
	}
NOTA: Los estilos son como los estilos de siempre

Los javascript tienen esta forma:
	const element = context;
	const categories = element.querySelector('.categories');
NOTA: El javascript es el codigo que se ejecuta en el componente luego de que se renderiza, no puede acceder a las variables del JSON, pero se pueden crear atributos data- para acceder a los datos en tiempo de ejecucion, el contexto es el elemento padre del componente

El JSON tiene esta forma:

es una lista de bojetos, como este:

{
	"type": string,
	"field": string,
	"label": string,
	"options": object[] | undefined,
	"required": boolean,
	"default": string | number | boolean | object,
	"form": object[] | undefined
}

aqui tienes un ejemplo de JSON:

[
	{
		"type": "group",
		"field": "accountType",
		"label": "Tipo de Cuenta",
		"options": [
			{"value": "personal", "label": "Personal"},
			{"value": "business", "label": "Empresarial"}
		],
		"required": true,
		"default": "personal"
		
	},
	{
		"type": "text",
		"field": "info",
		"label": "Nombre de la Empresa",
		"required": true
		"default": "Mi Empresa"
	},
	{
		"type": "array",
		"field": "additionalUsers",
		"label": "Usuarios Adicionales",
		default: [],
		"form": [
			{
				"type": "text",
				"field": "name",
				"label": "Nombre",
				"required": true",
				"default": "Usuario"
			},
			{
				"type": "text",
				"field": "email",
				"label": "Correo Electrónico",
				"required": true,
				"default": "aemail@email.com"
			}
		],
	},
	{
		"type": "bool",
		"field": "terms",
		"label": "Acepto los términos y condiciones",
		"required": true,
		"default": false
	},
	{
		"type": "icon",
		"field": "icon",
		"label": "Icono",
		"required": true,
		"default": {icon: "bi bi-person", size: 16, color: "#000000"}
	},
	{
		"type": "link",
		"field": "link",
		"label": "Enlace",
		"required": true,
		"default": {link: "https://www.google.com", label: "Google", target: "_blank"}
	},
	{
		"type": "background",
		"field": "background",
		"label": "Fondo",
		"required": true,
		"default": "linear-gradient(#000000bb, #000000bb)"
	},
	{
		"type": "color",
		"field": "color",
		"label": "Color",
		"required": true,
		"default": "#000000"
	},
	{
		"type": "color-set",
		"field": "colorSet",
		"label": "Conjunto de Colores",
		"required": true,
		"default": {color: "#000000", background: "#ffffff"}
	},
	{
		"type": "number",
		"field": "number",
		"label": "Número",
		"required": true,
		"default": 0
	},
	{
		"type": "align",
		"field": "align",
		"label": "Alineamiento",
		"required": true,
		"default": {direction: "row", justify: "flex-start", alignment: "flex-start", gap: 1, gridColumns: 12, style: "display: flex; flex-direction: row; align-items: flex-start; justify-content: flex-start; gap: 1px;"}
	},
	{
		"type": "units",
		"field": "units",
		"label": "Unidades",
		"required": true,
		"default": "0px"
	},
	{
		"type": "box-properties",
		"field": "boxProperties",
		"label": "Propiedades de Caja",
		"required": true,
		"default": "0px 16px"
	},
]
	NOTA: El JSON es el objeto que se le pasa al componente, siempre inicializa con un array,
	en el campo type pueden ir estos typos 'text' | 'paragraph' | 'group' | 'image' | 'color' | 'color-set' | 'bool' | 'number' | 'align' | 'icon' | 'link' | 'box-properties' | 'units' | 'background' | 'array',
	solo los de typo array pueden tener un campo form y anidar un arreglo de componentes, solo los de typo group pueden tener un campo options con un array de objetos con value y label, todos los demas typo pueden tener un campo default excepto los de typo array

	text: es un campo de texto
	paragraph: es un campo de parrafo, tiene html adento
	group: es un grupo de campos
	image: es un string con la url de la imagen
	color: es un color en formato hex
	color-set: es un conjunto de 2 colores {color: string, background: string}
	bool: es un booleano
	number: es un numero
	align: es un alineamiento {direction: string, justify: string, alignment: string, gap: number, gridColumns: number, style: string}. El Style tieene esta forma "display: flex; flex-direction: row; align-items: flex-start; justify-content: flex-start; gap: 1px;"
	icon: es un icono {icon: string, size: number, color: string}, icon es una clase de icono de bootstrap icon, size es en px, color es en hexagesimal
	link: es un link {link: string, label: string, target: string}, muy util para etiquetas a
	box-properties: es un conjunto de propiedades de caja con forma: 0px ó 0px 0px ó 0px 0% 0px ó 0px 0px 0px 0px
	units: es un conjunto de unidades con forma: 0px ó 0%
	background: es un conjunto de propiedades de fondo con forma: linear-gradient(#000000bb, #000000bb), url('https://fotografias.antena3.com/clipping/cmsimages01/2017/02/07/364CAAAC-A60E-43BB-8FED-05AA0B8F3AF9/58.jpg') center/cover no-repeat ó #000000bb
	array: es un array de campos


	NOTAS GENERALES:
	-Usar el template para renderizar los datos del JSON
	-Solo generar javascript si es necesario una interaccion con usuario o alguna logica luego de renderizar
	-Usar los estilos para darle estilo al componente
	-usar data- si es necesario acceder a los datos en tiempo de ejecucion, data- puede tener cualquier nombre
					`,
                },
                { role: 'user', content: this.prompt },
            ],
            response_format: zodResponseFormat(InstructionFormat, 'instruction'),
        });

        const data = completion.choices[0].message.parsed;

        this.jsonField = data?.json ?? '';
        this.templateField = data?.template ?? '';
        this.scriptField = data?.javascript ?? '';
        this.stylesField = data?.styles ?? '';

        this.data.emit({ json: this.jsonField, template: this.templateField, javascript: this.scriptField, styles: this.stylesField });
    }

    ngOnInit(): void {}
}
