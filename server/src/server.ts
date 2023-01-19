//ECMAScript Modules
import express from "express";
import cors from "cors"; //proteção da aplicação contra front-ends que ñ deveriam acessar o nosso back-end
import { PrismaClient } from "@prisma/client";
import { convertHourStringToMinutes } from "./utils/convert-hour-string-to-minutos";
import { convertMinutesToHoursString } from "./utils/convert-minutes-to-hour-string";

/**
 * Query: Persistencia de estado (o estado atual que aquela pagina se encontra naquele momento, por ex: filtros, ordenação, paginação e tudo que não for sensivel)
   ex: localhost:3333/ads?page=2&sort=title (o simbolo é o ? e sempre acompanha uma nomeação)

 * Route: Identificação de um recurso
   ex: localhost:3333/ads/5
   em um blog, por exemplo:
   localhost:3333/post/como-criar-uma-api-em-node
   
 * Body: para quando a gente for enviar varias Informações
   em uma única requisição (geralmente para envio de formulario)
   ex: criação de usuario (varias infos em uma request).
   - Não aparece na url, fica escondido na requisição.
 */

const app = express();

// por padrão, o express ñ entende que está vindo infos por .json, por isso precisamos
// avisar que permitimos enteder infos em json
app.use(express.json());

// Ativar quando estiver em produção
// Adicionar o site de origem
// app.use(cors({
//   origin: "http://siteEmProducao.com"
// }))

//Aqui permite que todos os front-end utilize o nosso back-end
app.use(cors());

const prisma = new PrismaClient({
  log: ["query"], //mostrar o log das dquery
});

// HTTP methos / API RESTful / HTTP Codes

// GET, POST, PUT, PATCH, DELETE

app.get("/games", async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        },
      },
    },
  });

  return response.json(games);
});

// request body
app.post("/games/:id/ads", async (request, response) => {
  const gameId = request.params.id;
  const body: any = request.body;
  console.log(body);
  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(","),
      hourStart: convertHourStringToMinutes(body.hourStart),
      hourEnd: convertHourStringToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel,
    },
  });

  return response.status(201).json(ad);
});

app.get("/games/:id/ads", async (request, response) => {
  const gameId = request.params.id;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return response.json(
    ads.map((ad) => {
      return {
        ...ad,
        weekDays: ad.weekDays.split(","),
        hourStart: convertMinutesToHoursString(ad.hourStart),
        hourEnd: convertMinutesToHoursString(ad.hourEnd),
      };
    })
  );
});

app.get("/ads/:id/discord", async (request, response) => {
  const adId = request.params.id;

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    },
  });

  return response.json({
    discord: ad.discord,
  });
});

// Em ambiente de dev, a aplicação roda
// no localhost com a porta indicada em listen
// por ex: http://localhost:3333/ads
// Se estivermos rodando varios apps devemos def. uma porta para cada
app.listen(3333);
