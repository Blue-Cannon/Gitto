use App\Facades\Top;
use Illuminate\Foundation\Inspiring;

Top::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
