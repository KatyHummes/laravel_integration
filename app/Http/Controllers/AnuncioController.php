<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Anuncio;
use Illuminate\Support\Facades\File;

class AnuncioController extends Controller
{
    public function importJsonData()
    {
        $filePath = storage_path('app/historico_anuncios.json');
        
        if (!File::exists($filePath)) {
            return response()->json(['message' => 'Arquivo JSON não encontrado.'], 404);
        }

        $jsonData = File::get($filePath);
        $anuncios = json_decode($jsonData, true);

        foreach ($anuncios as $anuncioData) {
            Anuncio::create([
                'url' => $anuncioData['url'],
                'local' => $anuncioData['local'],
                'preco' => $anuncioData['preco'],
                'screenshot' => $anuncioData['screenshot'],
                'data' => $anuncioData['data'],
            ]);
        }

        return response()->json(['message' => 'Dados importados com sucesso.']);
    }
}
